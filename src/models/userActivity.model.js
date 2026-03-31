import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserActivitySchema = new Schema(
  {
    activity_type: {
      type: String,
      enum: ['view', 'like', 'comment'],
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
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

UserActivitySchema.index({ postId: 1, userId: 1, activity_type: 1, createdAt: -1 });

const UserActivity = mongoose.model('UserActivity', UserActivitySchema, 'user_activities');

export default UserActivity;
