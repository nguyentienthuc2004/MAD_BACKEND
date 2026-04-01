import Like from "../models/like.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Follow from "../models/follow.model.js";
import UserActivity from "../models/userActivity.model.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";
import {
  countPostLikes,
  countPostComments,
} from "../services/count.service.js";
import { moderateImagesWithCheckpoint } from "../services/imageModeration.service.js";
import { moderateImagesWithAiService } from "../services/imageModerationApi.service.js";
import { getRecommendedPostIds } from "../services/recommendationApi.service.js";
import { createViewActivity } from "../services/userActivity.service.js";

const normalizeHashtags = (hashtags) => {
  const sanitize = (value) =>
    String(value).trim().replace(/^#+/, "").toLowerCase();

  if (!hashtags) return [];

  if (Array.isArray(hashtags)) {
    return hashtags.map(sanitize).filter(Boolean);
  }

  if (typeof hashtags === "string") {
    const trimmedHashtags = hashtags.trim();
    if (!trimmedHashtags) return [];

    try {
      const parsedHashtags = JSON.parse(trimmedHashtags);
      if (Array.isArray(parsedHashtags)) {
        return parsedHashtags.map(sanitize).filter(Boolean);
      }
    } catch {
      return trimmedHashtags.split(",").map(sanitize).filter(Boolean);
    }
  }

  return [];
};

const normalizeMusicId = (musicId) => {
  if (!musicId || musicId === "null" || musicId === "undefined") {
    return null;
  }

  return musicId;
};

const normalizeImageUrls = (images) => {
  if (!images) return [];

  if (Array.isArray(images)) {
    return images.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof images === "string") {
    const trimmedImages = images.trim();
    if (!trimmedImages) return [];

    try {
      const parsedImages = JSON.parse(trimmedImages);
      if (Array.isArray(parsedImages)) {
        return parsedImages.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return trimmedImages
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

export const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);
    const posts = await Post.find({
      userId,
      isDeleted: false,
    }).sort({ createdAt: -1 });
    const enriched = await Promise.all(
      posts.map(async (p) => ({
        ...p.toObject(),
        likeCount: await countPostLikes(p._id),
        commentCount: await countPostComments(p._id),
      })),
    );

    return res.status(200).json({
      success: true,
      message: "Posts retrieved successfully",
      data: enriched,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving posts",
      error: error.message,
    });
  }
};
export const createPost = async (req, res) => {
  try {
    const { caption = "", hashtags, musicId = null } = req.body;
    const user = req.user;

    if (!user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const parsedHashtags = normalizeHashtags(hashtags);
    const files = req.files || [];

    const imageModerationResult = await moderateImagesWithAiService({
      files,
    });

    const uploadedImages = await Promise.all(
      files.map(async (file) => {
        const uploaded = await uploadBufferToCloudinary(file.buffer, "posts");
        return uploaded.secure_url;
      }),
    );

    const newPost = await Post.create({
      userId: user.userId,
      caption,
      hashtags: parsedHashtags,
      images: uploadedImages,
      musicId: normalizeMusicId(musicId),
      isSensitive: imageModerationResult.isSensitive,
      moderationStatus: imageModerationResult.isSensitive ? "flagged" : "clean",
      moderationFlags: imageModerationResult.flags,
    });
    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: newPost,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the post",
      error: error.message,
    });
  }
};

export const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    let { caption, hashtags, musicId, existingImages } = req.body;
    console.log("[editPost] body:", JSON.stringify(req.body));
    // Đảm bảo existingImages luôn là mảng
    if (typeof existingImages === "string") {
      try {
        existingImages = JSON.parse(existingImages);
      } catch (e) {
        console.error("[editPost] Error parsing existingImages:", e);
        existingImages = [];
      }
    }
    if (!Array.isArray(existingImages)) {
      console.error("[editPost] existingImages is not an array after parse.");
      existingImages = [];
    }
    console.log("[editPost] Existing Images (normalized):", existingImages);
    const user = req.user;

    if (!user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const post = await Post.findOne({
      _id: postId,
      isDeleted: false,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (String(post.userId) !== String(user.userId)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to edit this post",
      });
    }

    const keptImages = normalizeImageUrls(existingImages);
    // Cho phép mọi URL Cloudinary hợp lệ, không kiểm tra phải là ảnh cũ trong post.images

    const files = req.files || [];
    const uploadedImages = await Promise.all(
      files.map(async (file) => {
        const uploaded = await uploadBufferToCloudinary(file.buffer, "posts");
        return uploaded.secure_url;
      }),
    );

    const mergedImages = [...keptImages, ...uploadedImages];

    if (mergedImages.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 images are allowed",
      });
    }

    if (caption !== undefined) {
      post.caption = caption;
    }

    if (hashtags !== undefined) {
      post.hashtags = normalizeHashtags(hashtags);
    }

    if (musicId !== undefined) {
      post.musicId = normalizeMusicId(musicId);
    }
    if (files.length > 0) {
      // Sử dụng AI moderation API thay cho script cục bộ
      const imageModerationResult = await moderateImagesWithAiService({
        files,
        threshold: 0.8, // hoặc lấy từ env/config nếu muốn
      });
      console.log("[editPost] Image Moderation Result:", imageModerationResult);
      post.isSensitive = imageModerationResult.isSensitive;
      post.moderationStatus = imageModerationResult.isSensitive
        ? "flagged"
        : "clean";
      post.moderationFlags = imageModerationResult.flags;
    }
    post.images = mergedImages;

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: post,
    });
  } catch (error) {
    console.error("[editPost] Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while editing the post",
      error: error.message,
      stack: error.stack,
    });
  }
};
export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findOne({
      _id: postId,
      isDeleted: false,
    });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const likeCount = await countPostLikes(post._id);
    const commentCount = await countPostComments(post._id);

    // Lưu lại hoạt động xem bài viết khi xem chi tiết
    if (req.user?.userId) {
      await createViewActivity(req.user.userId, post._id);
    }

    return res.status(200).json({
      success: true,
      message: "Post retrieved successfully",
      data: { ...post.toObject(), likeCount, commentCount },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the post",
      error: error.message,
    });
  }
};
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const user = req.user;

    if (!user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const post = await Post.findById(postId);

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (String(post.userId) !== String(user.userId)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this post",
      });
    }

    post.isDeleted = true;
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the post",
      error: error.message,
    });
  }
};
export const getPostsNotByMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const recommendedPostIds = await getRecommendedPostIds({
      userId: user.userId,
    }).catch((error) => {
      console.error("[getPostsNotByMe] Recommendation service error:", error.message);
      return [];
    });

    console.log("[getPostsNotByMe][debug] recommendedPostIds", {
      userId: String(user.userId),
      count: recommendedPostIds.length,
      sample: recommendedPostIds.slice(0, 20).map(String),
    });

    const followedUsers = await Follow.find({
      followerId: user.userId,
      isDeleted: false,
    }).select("followingId");

    const followedUserIds = followedUsers
      .map((followItem) => String(followItem.followingId))
      .filter(Boolean);

    const viewedActivities = await UserActivity.find({
      userId: user.userId,
      activity_type: "view",
      isDeleted: { $ne: true },
    }).select("postId");

    const viewedPostIds = viewedActivities
      .map((activity) => String(activity.postId))
      .filter(Boolean);
    const viewedPostIdSet = new Set(viewedPostIds);
    const uniqueViewedPostIds = Array.from(viewedPostIdSet);

    let followUnseenPostIds = [];

    if (followedUserIds.length) {
      const followUnseenPosts = await Post.find({
        userId: { $in: followedUserIds, $ne: user.userId },
        _id: { $nin: uniqueViewedPostIds },
        isDeleted: { $ne: true },
      })
        .select("_id")
        .sort({ createdAt: -1 });

      followUnseenPostIds = followUnseenPosts
        .map((post) => String(post._id))
        .filter(Boolean);
    }

    console.log("[getPostsNotByMe][debug] followUnseenPostIds", {
      userId: String(user.userId),
      count: followUnseenPostIds.length,
      sample: followUnseenPostIds.slice(0, 20),
    });

    console.log("[getPostsNotByMe][debug] viewedPostIds", {
      userId: String(user.userId),
      count: viewedPostIds.length,
      uniqueCount: uniqueViewedPostIds.length,
      sample: viewedPostIds.slice(0, 20),
    });

    const orderedPostIds = [];
    const seenPostIds = new Set();

    for (const postIdRaw of [...followUnseenPostIds, ...recommendedPostIds]) {
      const postId = String(postIdRaw || "");
      if (!postId || seenPostIds.has(postId) || viewedPostIdSet.has(postId)) {
        continue;
      }
      seenPostIds.add(postId);
      orderedPostIds.push(postId);
    }

    console.log("[getPostsNotByMe][debug] mergedOrderedPostIds", {
      userId: String(user.userId),
      count: orderedPostIds.length,
      sample: orderedPostIds.slice(0, 30),
    });

    let posts = [];

    if (orderedPostIds.length) {
      const orderedPostsRaw = await Post.find({
        _id: { $in: orderedPostIds },
      });

      const postById = new Map(
        orderedPostsRaw.map((post) => [String(post._id), post]),
      );

      const dropStats = {
        notFound: 0,
        isOwnPost: 0,
        isDeleted: 0,
        alreadyViewed: 0,
      };

      posts = orderedPostIds
        .map((postId) => {
          const post = postById.get(postId);
          if (!post) {
            dropStats.notFound += 1;
            return null;
          }

          if (String(post.userId) === String(user.userId)) {
            dropStats.isOwnPost += 1;
            return null;
          }

          if (post.isDeleted === true) {
            dropStats.isDeleted += 1;
            return null;
          }

          if (viewedPostIdSet.has(postId)) {
            dropStats.alreadyViewed += 1;
            return null;
          }

          return post;
        })
        .filter(Boolean);

      console.log("[getPostsNotByMe][debug] orderedPostFilterStats", {
        userId: String(user.userId),
        requested: orderedPostIds.length,
        resolved: orderedPostsRaw.length,
        kept: posts.length,
        dropped: dropStats,
      });
    }

    if (!posts.length) {
      posts = await Post.find({
        _id: { $nin: uniqueViewedPostIds },
        userId: { $ne: user.userId },
        isDeleted: { $ne: true },
      }).sort({ createdAt: -1 });

      console.log("[getPostsNotByMe][debug] fallbackUsed", {
        userId: String(user.userId),
        count: posts.length,
      });
    }

    console.log("[getPostsNotByMe][debug] responsePosts", {
      userId: String(user.userId),
      count: posts.length,
      sample: posts.slice(0, 30).map((p) => String(p._id)),
    });

    const enriched = await Promise.all(
      posts.map(async (p) => ({
        ...p.toObject(),
        likeCount: await countPostLikes(p._id),
        commentCount: await countPostComments(p._id),
      })),
    );

    const viewedAllPosts = enriched.length === 0;
    const responseMessage = viewedAllPosts
      ? "Bạn đã xem hết bài viết"
      : "Posts retrieved successfully";

    // Do not mark feed results as "viewed" here.
    // A view should be recorded only when the user opens a specific post (see `viewPost`).

    return res.status(200).json({
      success: true,
      message: responseMessage,
      viewedAllPosts,
      data: enriched,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving posts",
      error: error.message,
    });
  }
};


export const viewPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const user = req.user;

    if (!user?.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // create activity record
    try {
      const { createViewActivity } = await import("../services/userActivity.service.js");

      await createViewActivity(user.userId, postId);
    } catch (e) {
      // non-fatal: log and continue
      console.error('[viewPost] failed to record activity', e);
    }

    return res.status(201).json({ success: true, message: 'View recorded' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'An error occurred', error: error.message });

    // Lấy danh sách bài viết user đã like
  }
}


export const getPostsLikedByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }
    // Lấy danh sách postId user đã like (và chưa xóa like)
    const liked = await Like.find({ userId, targetType: "post", isDeleted: false }).select("targetId");
    const postIds = liked.map(l => l.targetId);
    if (!postIds.length) {
      return res.status(200).json({ success: true, data: [] });
    }
    // Lấy thông tin các bài viết đó
    const posts = await Post.find({ _id: { $in: postIds }, isDeleted: false }).sort({ createdAt: -1 });
    // enrich likeCount, commentCount
    const enriched = await Promise.all(posts.map(async (p) => ({
      ...p.toObject(),
      likeCount: await countPostLikes(p._id),
      commentCount: await countPostComments(p._id),
    })));
    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: "An error occurred while retrieving liked posts", error: error.message });
  }
};
