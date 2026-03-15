import User from "../models/user.model.js";
import Follow from "../models/follow.model.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";

/**
 * Get user profile by ID, with optional follow status check
 */
export const getUserById = async (id, currentUserId = null) => {
  const user = await User.findById(id).select("-password");

  if (!user || user.isDeleted) {
    return null;
  }

  const userProfile = user.toJSON();

  // Check if current user follows this user
  if (currentUserId && currentUserId.toString() !== id.toString()) {
    const follow = await Follow.findOne({
      followerId: currentUserId,
      followingId: id,
      isDeleted: false,
    });
    userProfile.isFollowing = !!follow;
  } else {
    userProfile.isFollowing = false;
  }

  return userProfile;
};

/**
 * Get current user's own profile
 */
export const getMyProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user || user.isDeleted) {
    return null;
  }

  return user.toJSON();
};

/**
 * Update user profile (displayName, fullName, bio)
 * Username is immutable and cannot be changed.
 */
export const updateProfile = async (userId, data) => {
  const updateData = {};
  const errors = [];

  // Reject username changes
  if (data.username !== undefined) {
    errors.push("Username cannot be changed");
  }

  if (data.displayName !== undefined) {
    if (typeof data.displayName !== "string" || data.displayName.trim().length === 0) {
      errors.push("Display name must be a non-empty string");
    } else {
      updateData.displayName = data.displayName.trim();
    }
  }

  if (data.fullName !== undefined) {
    if (typeof data.fullName !== "string") {
      errors.push("Full name must be a string");
    } else if (data.fullName.length > 100) {
      errors.push("Full name cannot exceed 100 characters");
    } else {
      updateData.fullName = data.fullName.trim();
    }
  }

  if (data.bio !== undefined) {
    if (typeof data.bio !== "string") {
      errors.push("Bio must be a string");
    } else if (data.bio.length > 500) {
      errors.push("Bio cannot exceed 500 characters");
    } else {
      updateData.bio = data.bio.trim();
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false, errors: ["No fields to update"] };
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  return { success: true, data: user.toJSON() };
};

/**
 * Upload/update user avatar via Cloudinary
 */
export const uploadAvatar = async (userId, fileBuffer) => {
  const uploadedResult = await uploadBufferToCloudinary(fileBuffer, "avatars");

  const user = await User.findByIdAndUpdate(
    userId,
    { avatarUrl: uploadedResult.secure_url },
    { new: true, runValidators: true }
  ).select("-password");

  return user.toJSON();
};

/**
 * Get all users (non-deleted)
 */
export const getAllUsers = async () => {
  const users = await User.find({ isDeleted: false }).select("-password");
  return users;
};

export default {
  getUserById,
  getMyProfile,
  updateProfile,
  uploadAvatar,
  getAllUsers,
};
