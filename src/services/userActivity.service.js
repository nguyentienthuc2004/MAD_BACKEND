import UserActivity from '../models/userActivity.model.js';

export async function createActivity(activity_type, userId, postId, meta = null) {
  if (!['view', 'like', 'comment'].includes(activity_type)) {
    throw new Error('Invalid activity_type');
  }

  const doc = await UserActivity.create({ activity_type, userId, postId, meta });
  return doc;
}

export async function createViewActivity(userId, postId) {
  return createActivity('view', userId, postId);
}

export async function createLikeActivity(userId, postId) {
  return createActivity('like', userId, postId);
}

export async function createCommentActivity(userId, postId) {
  return createActivity('comment', userId, postId);
}
