import mongoose from "mongoose";

const { Schema } = mongoose;

const LikeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["post", "comment"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

LikeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

const Like = mongoose.model("Like", LikeSchema, "likes");

export default Like;
