import Like from "../models/like.model.js";
import Comment from "../models/comment.model.js";

export const countPostLikes = async (postId) => {
  return Like.countDocuments({
    targetType: "post",
    targetId: postId,
    isDeleted: false,
  });
};

export const countCommentLikes = async (commentId) => {
  return Like.countDocuments({
    targetType: "comment",
    targetId: commentId,
    isDeleted: false,
  });
};

export const countPostComments = async (postId) => {
  return Comment.countDocuments({
    postId,
    isDeleted: false,
  });
};

export const countCommentReplies = async (rootCommentId) => {
  return Comment.countDocuments({
    rootCommentId,
    isDeleted: false,
    _id: { $ne: rootCommentId },
  });
};

export default {
  countPostLikes,
  countCommentLikes,
  countPostComments,
  countCommentReplies,
};
