import User from "../models/user.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  revokeAllUserRefreshTokens,
} from "../utils/generateToken.js";

export const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, phoneNumber } = req.body;

    if (!username || !email || !password || !confirmPassword || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Please provide username, email, password, confirm password and phone number",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      phoneNumber,
      avatarUrl: `https://res.cloudinary.com/ddfrjhhro/image/upload/v1773021182/avatar_trang_1_cd729c335b_rhsqgr.jpg`,
    });

    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
    });
    const refreshToken = await generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isDeleted: false,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.status === "banned") {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned",
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    user.isOnline = true;
    user.lastOnlineAt = new Date();
    await user.save();

    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
    });
    const refreshToken = await generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const storedToken = await verifyRefreshToken(token);

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
        code: "REFRESH_TOKEN_EXPIRED", // Client sẽ dựa vào code này để logout
      });
    }

    const user = await User.findById(storedToken.userId);
    
    if (!user || user.isDeleted) {
      await revokeRefreshToken(token);
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === "banned") {
      await revokeAllUserRefreshTokens(user._id);
      return res.status(403).json({
        success: false,
        message: "Your account has been banned",
      });
    }
    //cho client token moi, tranh dang nhap nhieu lan
    const newRefreshToken = await rotateRefreshToken(token, user._id);

    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during token refresh",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await revokeRefreshToken(token);
    }

    if (req.user) {
      await User.findByIdAndUpdate(req.user.userId, {
        isOnline: false,
        lastOnlineAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

export const logoutAll = async (req, res) => {
  try {
    await revokeAllUserRefreshTokens(req.user.userId);

    await User.findByIdAndUpdate(req.user.userId, {
      isOnline: false,
      lastOnlineAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Logged out from all devices successfully",
    });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user.toJSON(),
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
