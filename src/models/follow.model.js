import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Follower ID is required"],
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Following ID is required"],
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

// Ensure a user can only follow another user once
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

const Follow = mongoose.model("Follow", followSchema);

export default Follow;
