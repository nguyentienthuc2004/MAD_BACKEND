import mongoose from "mongoose";
import Like from "../models/like.model.js";
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import notificationService from "../services/notification.service.js";
import { countPostLikes, countCommentLikes } from "../services/count.service.js";
import { createLikeActivity } from "../services/userActivity.service.js";
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID format",
      });
    }

    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const existingLike = await Like.findOne({
      userId,
      targetType: "post",
      targetId: postId,
    });

    let liked;

    if (!existingLike) {
      await Like.create({
        userId,
        targetType: "post",
        targetId: postId,
      });

      liked = true;
      //thong bao cho chu post
      try {
        await notificationService.upsertActorNotification({
          userId: post.userId,
          actorId: userId,
          type: "like_post",
          targetPostId: postId,
          data: { postId },
        });
      } catch (e) {
        console.error("Notification upsert error:", e);
      }
      createLikeActivity(userId, postId);
    } else if (!existingLike.isDeleted) {
      await Like.updateOne(
        { _id: existingLike._id },
        { isDeleted: true }
      );

      liked = false;

      try {
        await notificationService.removeActorFromNotification({
          userId: post.userId,
          actorId: userId,
          type: "like_post",
          targetPostId: postId,
        });
      } catch (e) {
        console.error("Notification remove actor error:", e);
      }
    } else {
      await Like.updateOne(
        { _id: existingLike._id },
        { isDeleted: false }
      );

      liked = true;

      try {
        await notificationService.upsertActorNotification({
          userId: post.userId,
          actorId: userId,
          type: "like_post",
          targetPostId: postId,
          data: { postId },
        });
      } catch (e) {
        console.error("Notification upsert error:", e);
      }
    }

    const likeCount = await countPostLikes(postId);

    res.status(200).json({
      success: true,
      data: {
        liked,
        likeCount,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Like operation conflict, please retry",
      });
    }

    console.error("Like post error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID format",
      });
    }

    const comment = await Comment.findOne({ _id: commentId, isDeleted: false });
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const existingLike = await Like.findOne({
      userId,
      targetType: "comment",
      targetId: commentId,
    });

    let liked;

    if (!existingLike) {
      await Like.create({
        userId,
        targetType: "comment",
        targetId: commentId,
      });

      liked = true;
      //thong bao cho chu cmt
      try {
        await notificationService.upsertActorNotification({
          userId: comment.userId,
          actorId: userId,
          type: "like_comment",
          targetPostId: comment.postId,
          targetCommentId: commentId,
          data: { commentId, postId: comment.postId },
        });
      } catch (e) {
        console.error("Notification upsert error:", e);
      }
    } else if (!existingLike.isDeleted) {
      await Like.updateOne(
        { _id: existingLike._id },
        { isDeleted: true }
      );

      liked = false;
      try {
        await notificationService.removeActorFromNotification({
          userId: comment.userId,
          actorId: userId,
          type: "like_comment",
          targetPostId: comment.postId,
          targetCommentId: commentId,
        });
      } catch (e) {
        console.error("Notification remove actor error:", e);
      }
    } else {
      await Like.updateOne(
        { _id: existingLike._id },
        { isDeleted: false }
      );

      liked = true;

      try {
        await notificationService.upsertActorNotification({
          userId: comment.userId,
          actorId: userId,
          type: "like_comment",
          targetPostId: comment.postId,
          targetCommentId: commentId,
          data: { commentId, postId: comment.postId },
        });
      } catch (e) {
        console.error("Notification upsert error:", e);
      }
    }

    const likeCount = await countCommentLikes(commentId);

    res.status(200).json({
      success: true,
      data: {
        liked,
        likeCount,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Like operation conflict, please retry",
      });
    }

    console.error("Like comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
//checklikeuser
export const checkLikeStatus = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.user.userId;

    if (!["post", "comment"].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid target type. Must be 'post' or 'comment'",
      });
    }

    if (!isValidObjectId(targetId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid target ID format",
      });
    }

    const like = await Like.findOne({
      userId,
      targetType,
      targetId,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: {
        liked: !!like,
      },
    });
  } catch (error) {
    console.error("Check like status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getPostLikes = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID format",
      });
    }

    const likes = await Like.find({
      targetType: "post",
      targetId: postId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .populate("userId", "username avatar")
      .lean();

    const total = await Like.countDocuments({
      targetType: "post",
      targetId: postId,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        likes: likes.map((l) => l.userId),
      },
    });
  } catch (error) {
    console.error("Get post likes error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

  export const getCommentLikes = async (req, res) => {
    try {
      const { commentId } = req.params;

      if (!isValidObjectId(commentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid comment ID format",
        });
      }

      const likes = await Like.find({
        targetType: "comment",
        targetId: commentId,
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .populate("userId", "username avatar")
        .lean();

      const total = await Like.countDocuments({
        targetType: "comment",
        targetId: commentId,
        isDeleted: false,
      });

      res.status(200).json({
        success: true,
        data: {
          total,
          likes: likes.map((l) => l.userId),
        },
      });
    } catch (error) {
      console.error("Get comment likes error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
