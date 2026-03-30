import mongoose from "mongoose";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Follow from "../models/follow.model.js";

/**
 * Search users by username or full name using MongoDB text index.
 * Falls back to regex search when text index isn't available.
 * Returns: username, avatarUrl, followerCount, sorted by relevance.
 */
export const searchUsers = async (query, page = 1, limit = 20, currentUserId = null) => {
  const searchQuery = query.trim();
  const skip = (page - 1) * limit;

  let users;
  let totalCount;

  try {
    // Try text index search first (requires text index on User model)
    users = await User.find(
      {
        isDeleted: false,
        $text: { $search: searchQuery },
      },
      {
        score: { $meta: "textScore" },
      }
    )
      .select("username displayName fullName avatarUrl followerCount")
      .sort({ score: { $meta: "textScore" }, followerCount: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    totalCount = await User.countDocuments({
      isDeleted: false,
      $text: { $search: searchQuery },
    });
  } catch {
    // Fallback to regex search if text index not available
    const filter = {
      isDeleted: false,
      $or: [
        { username: { $regex: searchQuery, $options: "i" } },
        { displayName: { $regex: searchQuery, $options: "i" } },
        { fullName: { $regex: searchQuery, $options: "i" } },
      ],
    };

    users = await User.find(filter)
      .select("username displayName fullName avatarUrl followerCount")
      .sort({ followerCount: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    totalCount = await User.countDocuments(filter);
  }

  // Get follow status for current user
  let results = users.map((u) => u.toJSON());

  if (currentUserId) {
    const followDocs = await Follow.find({
      followerId: currentUserId,
      followingId: { $in: users.map((u) => u._id) },
      isDeleted: false,
    }).select("followingId");

    const followingSet = new Set(followDocs.map((f) => f.followingId.toString()));

    results = results.map((user) => ({
      ...user,
      isFollowing:
        followingSet.has(user._id.toString()) &&
        user._id.toString() !== currentUserId.toString(),
    }));
  }

  return {
    data: results,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit: parseInt(limit),
    },
  };
};

/**
 * Search posts by text content or hashtags using MongoDB text index.
 * Ranking factors: text relevance, recency, engagement (likes + comments).
 */
export const searchPosts = async (query, page = 1, limit = 20, sortBy = "relevant", currentUserId = null) => {
  const searchQuery = query.trim();
  const skip = (page - 1) * limit;

  let posts;
  let totalCount;

  try {
    // Try text index search for relevance-based results
    if (sortBy === "relevant") {
      // Use aggregation pipeline for combined scoring
      const matchStage = {
        isDeleted: false,
        $text: { $search: searchQuery },
      };

      if (currentUserId) {
        try {
          matchStage.userId = { $ne: mongoose.Types.ObjectId(currentUserId) };
        } catch (err) {
          // ignore invalid id conversion and do not add filter
        }
      }

      const pipeline = [
        { $match: matchStage },
        {
          $addFields: {
            textScore: { $meta: "textScore" },
            // Recency score: posts from the last 7 days get a boost
            recencyScore: {
              $divide: [
                1,
                {
                  $add: [
                    1,
                    {
                      $divide: [
                        { $subtract: [new Date(), "$createdAt"] },
                        1000 * 60 * 60 * 24, // Convert ms to days
                      ],
                    },
                  ],
                },
              ],
            },
            // Engagement score: normalized likes + comments
            engagementScore: {
              $add: [
                { $ifNull: ["$likeCount", 0] },
                { $multiply: [{ $ifNull: ["$commentCount", 0] }, 2] },
              ],
            },
          },
        },
        {
          $addFields: {
            // Combined relevance: 50% text + 25% recency + 25% engagement
            combinedScore: {
              $add: [
                { $multiply: ["$textScore", 10] },
                { $multiply: ["$recencyScore", 5] },
                { $multiply: ["$engagementScore", 0.1] },
              ],
            },
          },
        },
        { $sort: { combinedScore: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
      ];

      posts = await Post.aggregate(pipeline);

      // Populate user info
      posts = await Post.populate(posts, [
        { path: "userId", select: "-password" },
        { path: "musicId" },
      ]);

      const countFilter = { isDeleted: false, $text: { $search: searchQuery } };
      if (currentUserId) {
        try {
          countFilter.userId = { $ne: mongoose.Types.ObjectId(currentUserId) };
        } catch (err) {}
      }

      totalCount = await Post.countDocuments(countFilter);
    } else {
      throw new Error("Use regex fallback for non-relevant sorting");
    }
  } catch {
    // Fallback to regex search
    const filter = {
      isDeleted: false,
      $or: [
        { caption: { $regex: searchQuery, $options: "i" } },
        { hashtags: { $regex: searchQuery, $options: "i" } },
      ],
    };

    if (currentUserId) {
      try {
        filter.userId = { $ne: mongoose.Types.ObjectId(currentUserId) };
      } catch (err) {
        // ignore
      }
    }

    let sortOrder = { createdAt: -1 };
    if (sortBy === "popular") {
      sortOrder = { likeCount: -1, commentCount: -1 };
    } else if (sortBy === "trending") {
      sortOrder = { likeCount: -1, createdAt: -1 };
    } else if (sortBy === "relevant") {
      sortOrder = { likeCount: -1, commentCount: -1, createdAt: -1 };
    }

    posts = await Post.find(filter)
      .populate("userId", "-password")
      .populate("musicId")
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOrder);

    totalCount = await Post.countDocuments(filter);
  }

  return {
    data: posts,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit: parseInt(limit),
    },
  };
};

/**
 * Search posts by specific hashtag
 */
export const searchPostsByHashtag = async (hashtag, page = 1, limit = 20, currentUserId = null) => {
  const normalizedHashtag = hashtag.trim().replace(/^#+/, "").toLowerCase();
  const skip = (page - 1) * limit;

  const filter = {
    hashtags: normalizedHashtag,
    isDeleted: false,
  };

  if (currentUserId) {
    try {
      filter.userId = { $ne: mongoose.Types.ObjectId(currentUserId) };
    } catch (err) {}
  }

  const [posts, totalCount] = await Promise.all([
    Post.find(filter)
      .populate("userId", "-password")
      .populate("musicId")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Post.countDocuments(filter),
  ]);

  return {
    data: posts,
    hashtag: `#${normalizedHashtag}`,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit: parseInt(limit),
    },
  };
};

/**
 * Get trending hashtags by aggregation
 */
export const getTrendingHashtags = async (limit = 10) => {
  const trendingHashtags = await Post.aggregate([
    { $match: { isDeleted: false } },
    { $unwind: "$hashtags" },
    {
      $group: {
        _id: "$hashtags",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: parseInt(limit) },
  ]);

  return trendingHashtags.map((h) => ({
    hashtag: `#${h._id}`,
    count: h.count,
  }));
};

/**
 * Global search across users, posts, and hashtags
 */
export const globalSearch = async (query, limit = 5, currentUserId = null) => {
  const searchQuery = query.trim().toLowerCase();

  const [users, posts, hashtagMatches] = await Promise.all([
    User.find({
      isDeleted: false,
      $or: [
        { username: { $regex: searchQuery, $options: "i" } },
        { displayName: { $regex: searchQuery, $options: "i" } },
        { fullName: { $regex: searchQuery, $options: "i" } },
      ],
    })
      .select("username displayName fullName avatarUrl followerCount")
      .limit(parseInt(limit)),

    (() => {
      const pFilter = {
        isDeleted: false,
        $or: [
          { caption: { $regex: searchQuery, $options: "i" } },
          { hashtags: { $in: [searchQuery] } },
        ],
      };

      if (currentUserId) {
        try {
          pFilter.userId = { $ne: mongoose.Types.ObjectId(currentUserId) };
        } catch (err) {}
      }

      return Post.find(pFilter).populate("userId", "-password").limit(parseInt(limit)).sort({ createdAt: -1 });
    })(),

    (() => {
      const hFilter = { hashtags: { $regex: searchQuery, $options: "i" }, isDeleted: false };
      return Post.find(hFilter).select("hashtags");
    })(),
  ]);

  const hashtags = [...new Set(hashtagMatches.flatMap((p) => p.hashtags))].slice(
    0,
    parseInt(limit)
  );

  return {
    users,
    posts,
    hashtags: hashtags.map((h) => `#${h}`),
  };
};

export default {
  searchUsers,
  searchPosts,
  searchPostsByHashtag,
  getTrendingHashtags,
  globalSearch,
};
