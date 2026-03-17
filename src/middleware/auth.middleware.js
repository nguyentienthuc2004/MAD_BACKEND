import { verifyAccessToken } from "../utils/generateToken.js";
import User from "../models/user.model.js";

//middleware xác thực access token
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token is required",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === "banned") {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned",
      });
    }

    if (user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: "User account has been deleted",
      });
    }
    req.user = {
      userId: user._id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
    };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token has expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

