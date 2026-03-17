import { moderateContent } from "../services/moderation.service.js";

/**
 * Middleware to moderate post content (caption).
 * Blocks content with severity "blocked", allows "warning" with flag.
 */
export const moderatePost = (req, res, next) => {
  const { caption } = req.body;

  if (!caption) {
    return next();
  }

  const result = moderateContent({ caption });

  if (result.severity === "blocked") {
    return res.status(400).json({
      success: false,
      message: "Your post contains content that violates our community guidelines",
      moderationFlags: result.flags,
    });
  }

  // Attach moderation result for the controller to use
  req.moderationResult = {
    status: result.severity === "warning" ? "flagged" : "clean",
    flags: result.flags,
  };

  next();
};

/**
 * Middleware to moderate comment content.
 * Blocks content with severity "blocked", allows "warning" with flag.
 */
export const moderateComment = (req, res, next) => {
  const { content } = req.body;

  if (!content) {
    return next();
  }

  const result = moderateContent({ content });

  if (result.severity === "blocked") {
    return res.status(400).json({
      success: false,
      message: "Your comment contains content that violates our community guidelines",
      moderationFlags: result.flags,
    });
  }

  req.moderationResult = {
    status: result.severity === "warning" ? "flagged" : "clean",
    flags: result.flags,
  };

  next();
};

/**
 * Middleware to moderate user bio content.
 */
export const moderateBio = (req, res, next) => {
  const { bio } = req.body;

  if (!bio) {
    return next();
  }

  const result = moderateContent({ bio });

  if (result.severity === "blocked") {
    return res.status(400).json({
      success: false,
      message: "Your bio contains content that violates our community guidelines",
      moderationFlags: result.flags,
    });
  }

  req.moderationResult = {
    status: result.severity === "warning" ? "flagged" : "clean",
    flags: result.flags,
  };

  next();
};

export default {
  moderatePost,
  moderateComment,
  moderateBio,
};
