import userService from "../services/user.service.js";

/**
 * Get all users
 * GET /users
 */
export const getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get user profile by ID
 * GET /users/:id
 */
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    const userProfile = await userService.getUserById(id, currentUserId);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({ success: true, data: userProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const getUserDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the user",
      error: error.message,
    });
  }
};
/**
 * Get current user profile
 * GET /users/profile/me
 */
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const profile = await userService.getMyProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error("Error fetching my profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update user profile (displayName, fullName, bio)
 * PUT /users/profile
 */

export const updateProfile = async (req, res) => {
  try {
    const updatedUser = await userService.updateProfile(req.user.userId, req.body);
    return res.json({ success: true, message: "Profile updated successfully", data: updatedUser });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Upload/Update avatar
 * POST /users/avatar
 */
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }


    const userData = await userService.uploadAvatar(userId, req.file.buffer);

    // --- Cập nhật avatar user trong các room-chat ---
    try {
      const RoomChat = (await import("../models/room-chat.model.js")).default;
      // Tìm tất cả các phòng chat mà user là thành viên
      await RoomChat.updateMany(
        { isDeleted: false, "users.user_id": userId },
        { $set: { "users.$[elem].avatar": userData.avatarUrl } },
        { arrayFilters: [{ "elem.user_id": userId }] }
      );
      // Phát socket event cho các room
      const io = req.app.get("io");
      if (io) {
        const rooms = await RoomChat.find({
          isDeleted: false,
          "users.user_id": userId
        }).select("_id");
        rooms.forEach(room => {
          io.to(String(room._id)).emit("USER_AVATAR_CHANGED", {
            userId,
            avatarUrl: userData.avatarUrl
          });
        });
      }
    } catch (e) {
      console.error("Update room-chat avatar or emit USER_AVATAR_CHANGED error:", e);
    }

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: userData,
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const updatedUser = await userService.changePassword(req.user.userId, req.body);
    return res.json({ success: true, message: "Password changed successfully", data: updatedUser });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default {
  getUsers,
  getUserProfile,
  getMyProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
};
