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
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { displayName, fullName, bio } = req.body;
    const result = await userService.updateProfile(userId, {
      displayName,
      fullName,
      bio,
      username: req.body.username, // Pass through for immutability check
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.errors.join("; "),
        errors: result.errors,
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
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

export default {
  getUsers,
  getUserProfile,
  getMyProfile,
  updateProfile,
  uploadAvatar,
};
