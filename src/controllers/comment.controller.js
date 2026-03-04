import mongoose from "mongoose";
import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import notificationService from "../services/notification.service.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body || {};
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

    const comment = await Comment.create({
      postId,
      userId,
      content: content.trim(),
      parentCommentId: null,
    });
    //thong bao cho chu post
    await notificationService.createAndEmit({
      userId: post.userId,
      actorId: userId,
      type: "comment",
      targetPostId: postId,
      targetCommentId: comment._id,
      data: { postId, commentId: comment._id },
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "userId",
      "username avatar"
    );

    res.status(201).json({
      success: true,
      data: {
        comment: populatedComment,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((e) => e.message),
      });
    }

    console.error("Create comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const replyToComment = async (req, res) => {
  try {
    const { postId, parentCommentId } = req.params;
    const { content } = req.body || {};
    const userId = req.user.userId;

    if (!isValidObjectId(postId) || !isValidObjectId(parentCommentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const parentComment = await Comment.findOne({
      _id: parentCommentId,
      postId,
      isDeleted: false,
    });

    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: "Parent comment not found",
      });
    }

    const rootId = parentComment.rootCommentId;

    const reply = await Comment.create({
      postId,
      userId,
      content: content.trim(),
      rootCommentId: rootId,
      parentCommentId: parentComment._id,
      mentionUserId: parentComment.userId,
    });
    //thong bao cho nguoi duoc reply
    await notificationService.createAndEmit({
      userId: parentComment.userId,
      actorId: userId,
      type: "reply",
      targetPostId: postId,
      targetCommentId: reply._id,
      data: { postId, commentId: reply._id, parentCommentId },
    });
    //thong bao cho chu bai viet
    if (post.userId.toString() !== parentComment.userId.toString() &&
        post.userId.toString() !== userId.toString()) {
      await notificationService.createAndEmit({
        userId: post.userId,
        actorId: userId,
        type: "comment",
        targetPostId: postId,
        targetCommentId: reply._id,
        data: { postId, commentId: reply._id },
      });
    }
    //thong bao cho nguoi duoc nhac den trong reply
    if (parentComment.mentionUserId &&
        parentComment.mentionUserId.toString() !== userId.toString() &&
        parentComment.mentionUserId.toString() !== parentComment.userId.toString()) {
      await notificationService.createAndEmit({
        userId: parentComment.mentionUserId,
        actorId: userId,
        type: "mention",
        targetPostId: postId,
        targetCommentId: reply._id,
        data: { postId, commentId: reply._id },
      });
    }

    const populatedReply = await Comment.findById(reply._id)
      .populate("userId", "username avatar")
      .populate("mentionUserId", "username");

    res.status(201).json({
      success: true,
      data: {
        comment: populatedReply,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((e) => e.message),
      });
    }

    console.error("Reply to comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // if (!isValidObjectId(postId)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid post ID format",
    //   });
    // }

    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const rootQuery = {
      postId,
      isDeleted: false,
      parentCommentId: null,
    };

    const comments = await Comment.find(rootQuery)
      .sort({ createdAt: -1 })
      .populate("userId", "username avatar")
      .populate("mentionUserId", "username")
      .lean();

    const total = await Comment.countDocuments(rootQuery);

    res.status(200).json({
      success: true,
      data: {
        total,
        comments,
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getCommentReplies = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    if (!isValidObjectId(postId) || !isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    const rootComment = await Comment.findOne({
      _id: commentId,
      postId,
      isDeleted: false,
    });

    if (!rootComment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (rootComment.rootCommentId.toString() !== rootComment._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "commentId must be a root comment",
      });
    }

    const replies = await Comment.find({
      postId,
      rootCommentId: rootComment._id,
      _id: { $ne: rootComment._id },
      isDeleted: false,
    })
      .sort({ createdAt: 1 })
      .populate("userId", "username avatar")
      .populate("mentionUserId", "username")
      .lean();

    const total = await Comment.countDocuments({
      postId,
      rootCommentId: rootComment._id,
      _id: { $ne: rootComment._id },
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        replies,
      },
    });
  } catch (error) {
    console.error("Get comment replies error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const editComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!isValidObjectId(postId) || !isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      postId,
      isDeleted: false,
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own comments",
      });
    }

    comment.content = content.trim();
    comment.updatedAt = new Date();
    await comment.save();

    const updatedComment = await Comment.findById(commentId)
      .populate("userId", "username avatar")
      .populate("mentionUserId", "username");

    res.status(200).json({
      success: true,
      data: {
        comment: updatedComment,
      },
    });
  } catch (error) {
    console.error("Edit comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.userId;

    if (!isValidObjectId(postId) || !isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      postId,
      isDeleted: false,
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const post = await Post.findById(postId);

    const isOwner = comment.userId.toString() === userId.toString();
    const isPostOwner = post && post.userId.toString() === userId.toString();

    if (!isOwner && !isPostOwner) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this comment",
      });
    }

    comment.isDeleted = true;
    await comment.save();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getCommentById = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    if (!isValidObjectId(postId) || !isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      postId,
      isDeleted: false,
    })
      .populate("userId", "username avatar")
      .populate("mentionUserId", "username");

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        comment,
      },
    });
  } catch (error) {
    console.error("Get comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
