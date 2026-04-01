import UserActivity from '../models/userActivity.model.js';

const ALLOWED_ACTIVITY_TYPES = ['view', 'like', 'comment'];

export async function createActivity(activity_type, userId, postId, meta = null) {
  if (!ALLOWED_ACTIVITY_TYPES.includes(activity_type)) {
    throw new Error('Invalid activity_type');
  }

  const doc = await UserActivity.create({ activity_type, userId, postId, meta });
  return doc;
}

export async function createViewActivity(userId, postId, meta = null) {
  const update = { $set: { isDeleted: false, meta: meta ?? null } };

  return UserActivity.findOneAndUpdate(
    { activity_type: 'view', userId, postId },
    { ...update, $setOnInsert: { activity_type: 'view', userId, postId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function createLikeActivity(userId, postId) {
  return createActivity('like', userId, postId);
}

export async function createCommentActivity(userId, postId) {
  return createActivity('comment', userId, postId);
}
