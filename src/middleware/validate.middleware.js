import mongoose from "mongoose";

/**
 * Validate MongoDB ObjectId in request params
 */
export const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}: must be a valid ObjectId`,
      });
    }

    next();
  };
};

/**
 * Validate profile update input
 * - Rejects username changes
 * - Validates fullName (string, max 100 chars)
 * - Validates displayName (non-empty string)
 * - Validates bio (string, max 500 chars)
 */
export const validateUpdateProfile = (req, res, next) => {
  const { username,  fullName, bio } = req.body;
  const errors = [];

  if (username !== undefined) {
    errors.push("Username cannot be changed");
  }

  if (fullName !== undefined) {
    if (typeof fullName !== "string") {
      errors.push("Full name must be a string");
    } else if (fullName.length > 100) {
      errors.push("Full name cannot exceed 100 characters");
    }
  }

  if (bio !== undefined) {
    if (typeof bio !== "string") {
      errors.push("Bio must be a string");
    } else if (bio.length > 500) {
      errors.push("Bio cannot exceed 500 characters");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join("; "),
      errors,
    });
  }

  next();
};

/**
 * Validate search query parameter
 */
export const validateSearchQuery = (req, res, next) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  next();
};

export default {
  validateObjectId,
  validateUpdateProfile,
  validateSearchQuery,
};
