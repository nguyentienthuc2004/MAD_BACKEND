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

const normalizeImageUrls = (images) => {
  if (!images) return [];

  if (Array.isArray(images)) {
    return images.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof images === "string") {
    const trimmedImages = images.trim();
    if (!trimmedImages) return [];

    try {
      const parsedImages = JSON.parse(trimmedImages);
      if (Array.isArray(parsedImages)) {
        return parsedImages.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return trimmedImages
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};
export const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);
    const posts = await Post.find({
      userId,
      isDeleted: false,
    }).sort({ createdAt: -1 });
    console.log(posts);
    return res.status(200).json({
      success: true,
      message: "Posts retrieved successfully",
      data: posts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving posts",
      error: error.message,
    });
  }
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

export const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { caption, hashtags, musicId, existingImages } = req.body;
    const user = req.user;

    if (!user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const post = await Post.findOne({
      _id: postId,
      isDeleted: false,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (String(post.userId) !== String(user.userId)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to edit this post",
      });
    }

    const keptImages = normalizeImageUrls(existingImages);
    const invalidImages = keptImages.filter((imageUrl) => !post.images.includes(imageUrl));

    if (invalidImages.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some existing image URLs are invalid",
      });
    }

    const files = req.files || [];
    const uploadedImages = await Promise.all(
      files.map(async (file) => {
        const uploaded = await uploadBufferToCloudinary(file.buffer, "posts");
        return uploaded.secure_url;
      })
    );

    const mergedImages = [...keptImages, ...uploadedImages];

    if (mergedImages.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 images are allowed",
      });
    }

    if (caption !== undefined) {
      post.caption = caption;
    }

    if (hashtags !== undefined) {
      post.hashtags = normalizeHashtags(hashtags);
    }

    if (musicId !== undefined) {
      post.musicId = normalizeMusicId(musicId);
    }

    post.images = mergedImages;

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: post,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while editing the post",
      error: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const user = req.user;

    if (!user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const post = await Post.findById(postId);

    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (String(post.userId) !== String(user.userId)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this post",
      });
    }

    post.isDeleted = true;
    await post.save();

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the post",
      error: error.message,
    });
  }
};