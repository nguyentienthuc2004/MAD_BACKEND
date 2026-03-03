import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../models/RefreshToken.js";

const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES;
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS);

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
};

export const generateRefreshToken = async (userId) => {
  const tokenValue = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${REFRESH_TOKEN_EXPIRES_DAYS}d`,
  });
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  const hashTOken = crypto.createHash("sha256").update(tokenValue).digest("hex");
  await RefreshToken.create({
    userId,
    hashToken: hashTOken,
    expiresAt,
  });

  return tokenValue;
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = async (token) => {
  try {
    // Verify JWT signature trước
    jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    // Sau đó check trong DB
    const hashToken = crypto.createHash("sha256").update(token).digest("hex");
    const refreshToken = await RefreshToken.findOne({
      hashToken,
      expiresAt: { $gt: new Date() },
    });
    return refreshToken;
  } catch (error) {
    // Token không hợp lệ hoặc hết hạn
    return null;
  }
};
  
export const revokeRefreshToken = async (token) => {
  const hashToken = crypto.createHash("sha256").update(token).digest("hex");
  await RefreshToken.deleteOne({ hashToken });
};

export const revokeAllUserRefreshTokens = async (userId) => {
  await RefreshToken.deleteMany({ userId });
};

//xóa token cũ, tạo token mới
export const rotateRefreshToken = async (oldToken, userId) => {
  // Truyền oldToken gốc vào revokeRefreshToken (nó sẽ tự hash)
  await revokeRefreshToken(oldToken);
  return await generateRefreshToken(userId);
};
