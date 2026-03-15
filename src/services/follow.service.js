import User from "../models/user.model.js";
import Follow from "../models/follow.model.js";

/**
 * Follow a user
 * - Prevents self-follow
 * - Prevents duplicate follows
 * - Restores soft-deleted follow relationships
 * - Updates follower/following counts atomically
 */
export const followUser = async (followerId, followingId) => {
  if (followerId.toString() === followingId.toString()) {
    return { success: false, status: 400, message: "You cannot follow yourself" };
  }

  const followingUser = await User.findById(followingId);

  if (!followingUser || followingUser.isDeleted) {
    return { success: false, status: 404, message: "User not found" };
  }

  // Check if already following (active)
  const existingFollow = await Follow.findOne({
    followerId,
    followingId,
    isDeleted: false,
  });

  if (existingFollow) {
    return { success: false, status: 400, message: "You are already following this user" };
  }

  // Check if there's a soft-deleted follow relationship to restore
  const deletedFollow = await Follow.findOne({
    followerId,
    followingId,
    isDeleted: true,
  });

  if (deletedFollow) {
    deletedFollow.isDeleted = false;
    await deletedFollow.save();
  } else {
    await Follow.create({ followerId, followingId });
  }

  // Update follow counts atomically
  await Promise.all([
    User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } }),
    User.findByIdAndUpdate(followingId, { $inc: { followerCount: 1 } }),
  ]);

  return { success: true };
};

/**
 * Unfollow a user
 * - Soft-deletes the follow relationship
 * - Decrements follower/following counts
 */
export const unfollowUser = async (followerId, followingId) => {
  if (followerId.toString() === followingId.toString()) {
    return { success: false, status: 400, message: "You cannot unfollow yourself" };
  }

  const follow = await Follow.findOne({
    followerId,
    followingId,
    isDeleted: false,
  });

  if (!follow) {
    return { success: false, status: 400, message: "You are not following this user" };
  }

  // Soft delete the follow relationship
  follow.isDeleted = true;
  await follow.save();

  // Update follow counts atomically
  await Promise.all([
    User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } }),
    User.findByIdAndUpdate(followingId, { $inc: { followerCount: -1 } }),
  ]);

  return { success: true };
};

/**
 * Get paginated list of followers for a user
 */
export const getFollowers = async (userId, page = 1, limit = 20) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    return { success: false, status: 404, message: "User not found" };
  }

  const skip = (page - 1) * limit;

  const [followers, totalCount] = await Promise.all([
    Follow.find({ followingId: userId, isDeleted: false })
      .populate("followerId", "-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Follow.countDocuments({ followingId: userId, isDeleted: false }),
  ]);

  return {
    success: true,
    data: followers.map((f) => f.followerId),
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit: parseInt(limit),
    },
  };
};

/**
 * Get paginated list of users that a user is following
 */
export const getFollowing = async (userId, page = 1, limit = 20) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    return { success: false, status: 404, message: "User not found" };
  }

  const skip = (page - 1) * limit;

  const [following, totalCount] = await Promise.all([
    Follow.find({ followerId: userId, isDeleted: false })
      .populate("followingId", "-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Follow.countDocuments({ followerId: userId, isDeleted: false }),
  ]);

  return {
    success: true,
    data: following.map((f) => f.followingId),
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit: parseInt(limit),
    },
  };
};

/**
 * Check if a user is following another user
 */
export const checkFollowStatus = async (currentUserId, targetUserId) => {
  const follow = await Follow.findOne({
    followerId: currentUserId,
    followingId: targetUserId,
    isDeleted: false,
  });

  return { isFollowing: !!follow };
};

export default {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
};
