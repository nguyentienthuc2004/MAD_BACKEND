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
 * Update user profile (displayName, fullName, phoneNumber, bio, avatarUrl, birthday)
 * Username is immutable and cannot be changed.
 */
export const updateProfile = async (userId, data) => {
  const allowedUpdates = [
    "displayName", "fullName",
    "bio", "phoneNumber", "birthday", "avatarUrl"
  ];

  const updateData = {};
  for (const key of allowedUpdates) {
    if (data[key] !== undefined) {
      if (key === "birthday") {
        // Convert birthday string to Date or null
        updateData[key] = data[key] ? new Date(data[key]) : null;
      } else {
        updateData[key] = typeof data[key] === "string" ? data[key].trim() : data[key];
      }
    }
  }
  if (Object.keys(updateData).length === 0) {
    throw new Error("No valid fields provided for update");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    {
      new: true,
      runValidators: true
    }
  );

  if (!user) throw new Error("User not found");
  return user.toJSON();
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

/**
 * change password
 */
export const changePassword = async (userId, data) => {
  const user = await User.findById(userId).select("+password");
  if (!user || user.isDeleted) {
    throw new Error("User not found or has been deactivated");
  }

  const { oldPassword, newPassword, confirmPassword } = data;
  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new Error("Old password, new password and confirm password are required");
  }

  if (oldPassword === newPassword) {
    throw new Error("New password must be different from the old one");
  }
  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters");
  }
  if (confirmPassword !== newPassword) {
    throw new Error("Confirm password does not match new password");
  }
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new Error("The current password you entered is incorrect");
  }
  user.password = newPassword;
  await user.save();
  return user.toJSON();
};

export default {
  getUserById,
  getMyProfile,
  updateProfile,
  uploadAvatar,
  getAllUsers,
  changePassword,
};
