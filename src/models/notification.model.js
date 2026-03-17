import mongoose from "mongoose";

const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastActor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    count: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ["like_post", "like_comment", "reply", "mention", "comment"],
      required: true,
    },
    targetPostId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    targetCommentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    data: {
      type: Object,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
NotificationSchema.index({ userId: 1, type: 1, targetPostId: 1, targetCommentId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, isRead: 1, updatedAt: -1 });

const Notification = mongoose.model("Notification", NotificationSchema, "notifications");

export default Notification;
