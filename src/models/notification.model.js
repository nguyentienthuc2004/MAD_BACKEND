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
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
  }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", NotificationSchema, "notifications");

export default Notification;
