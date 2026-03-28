/**
 * Check follow status
 * GET /follow/:userId/status
 */
export const checkFollowStatus = async (req, res) => {
  try {
    const followerId = req.user?.userId;
    const { userId } = req.params;
    console.log("Check follow status:", { followerId, userId });
    if (!followerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (followerId === userId) {
      // Không thể tự follow chính mình
      return res.json({ isFollowing: false });
    }
    const follow = await (await import("../models/follow.model.js")).default.findOne({
      followerId,
      followingId: userId,
    });
    res.json({ isFollowing: !!follow });
  } catch (error) {
    console.error("Error checking follow status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
import followService from "../services/follow.service.js";

/**
 * Follow a user
 * POST /follow/:userId
 */
export const followUser = async (req, res) => {
  try {
    const followerId = req.user?.userId;
    const { userId } = req.params;

    if (!followerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await followService.followUser(followerId, userId);

    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    // Lấy lại thông tin followerCount/followingCount mới nhất của cả 2 user
    const [followerUser, followingUser] = await Promise.all([
      (await import("../models/user.model.js")).default.findById(followerId),
      (await import("../models/user.model.js")).default.findById(userId),
    ]);

    res.status(201).json({
      success: true,
      message: "User followed successfully",
      follower: {
        _id: followerUser._id,
        followingCount: followerUser.followingCount,
        followerCount: followerUser.followerCount,
      },
      following: {
        _id: followingUser._id,
        followingCount: followingUser.followingCount,
        followerCount: followingUser.followerCount,
      },
    });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Unfollow a user
 * DELETE /follow/:userId
 */
export const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user?.userId;
    const { userId } = req.params;

    if (!followerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await followService.unfollowUser(followerId, userId);

    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    // Lấy lại thông tin followerCount/followingCount mới nhất của cả 2 user
    const [followerUser, followingUser] = await Promise.all([
      (await import("../models/user.model.js")).default.findById(followerId),
      (await import("../models/user.model.js")).default.findById(userId),
    ]);

    res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
      follower: {
        _id: followerUser._id,
        followingCount: followerUser.followingCount,
        followerCount: followerUser.followerCount,
      },
      following: {
        _id: followingUser._id,
        followingCount: followingUser.followingCount,
        followerCount: followingUser.followerCount,
      },
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get followers list
 * GET /users/:userId/followers (or /users/:id/followers)
 */
export const getFollowers = async (req, res) => {
  try {
    const userId = req.params.userId || req.params.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await followService.getFollowers(userId, page, limit);

    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get following list
 * GET /users/:userId/following (or /users/:id/following)
 */
export const getFollowing = async (req, res) => {
  try {
    const userId = req.params.userId || req.params.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await followService.getFollowing(userId, page, limit);

    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching following:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// /**
//  * Check follow status
//  * GET /users/:userId/follow-status
//  */
// export const checkFollowStatus = async (req, res) => {
//   try {
//     const currentUserId = req.user?.userId;
//     const { userId } = req.params;

//     if (!currentUserId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     const result = await followService.checkFollowStatus(currentUserId, userId);

//     res.status(200).json({
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     console.error("Error checking follow status:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

export default {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
};
