import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../models/RefreshToken.js";

const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
};

export const generateRefreshToken = async (userId) => {
  const tokenValue = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await RefreshToken.create({
    userId,
    token: tokenValue,
    expiresAt,
  });

  return tokenValue;
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = async (token) => {
  const refreshToken = await RefreshToken.findOne({
    token,
    expiresAt: { $gt: new Date() },
  });
  return refreshToken;
};

export const revokeRefreshToken = async (token) => {
  await RefreshToken.deleteOne({ token });
};

export const revokeAllUserRefreshTokens = async (userId) => {
  await RefreshToken.deleteMany({ userId });
};

//xóa token cũ, tạo token mới
export const rotateRefreshToken = async (oldToken, userId) => {
  await revokeRefreshToken(oldToken);
  return await generateRefreshToken(userId);
};
