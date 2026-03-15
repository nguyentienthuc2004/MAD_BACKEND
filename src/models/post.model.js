import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    caption: {
      type: String,
      default: "",
      trim: true,
    },
    hashtags: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    musicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Music",
      default: null,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    moderationStatus: {
      type: String,
      enum: ["clean", "flagged", "blocked"],
      default: "clean",
    },
    moderationFlags: [
      {
        type: String,
        trim: true,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for full-text search on caption and hashtags
postSchema.index(
  { caption: "text", hashtags: "text" },
  { weights: { caption: 5, hashtags: 10 } }
);

const Post = mongoose.model("Post", postSchema, "posts");

export default Post;
