import Post from "../models/post.model.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";

const normalizeHashtags = (hashtags) => {
  const sanitize = (value) =>
    String(value)
      .trim()
      .replace(/^#+/, "")
      .toLowerCase();

  if (!hashtags) return [];

  if (Array.isArray(hashtags)) {
    return hashtags.map(sanitize).filter(Boolean);
  }

  if (typeof hashtags === "string") {
    const trimmedHashtags = hashtags.trim();
    if (!trimmedHashtags) return [];

    try {
      const parsedHashtags = JSON.parse(trimmedHashtags);
      if (Array.isArray(parsedHashtags)) {
        return parsedHashtags.map(sanitize).filter(Boolean);
      }
    } catch {
      return trimmedHashtags
        .split(",")
        .map(sanitize)
        .filter(Boolean);
    }
  }

  return [];
};

const normalizeMusicId = (musicId) => {
  if (!musicId || musicId === "null" || musicId === "undefined") {
    return null;
  }

  return musicId;
};

export const createPost = async (req, res) => {
  try {
    const { caption = "", hashtags, musicId = null } = req.body;
    const user = req.user;

    if (!user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const parsedHashtags = normalizeHashtags(hashtags);
    const files = req.files || [];

    const uploadedImages = await Promise.all(
      files.map(async (file) => {
        const uploaded = await uploadBufferToCloudinary(file.buffer, "posts");
        return uploaded.secure_url;
      })
    );

    const newPost = await Post.create({
      userId: user.userId,
      caption,
      hashtags: parsedHashtags,
      images: uploadedImages,
      musicId: normalizeMusicId(musicId),
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: newPost,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the post",
      error: error.message,
    });
  }
};