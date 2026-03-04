import Notification from "../models/notification.model.js";

export const createNotification = async (payload) => {
  const { userId, actorId, type, targetPostId, targetCommentId, data } = payload;

  if (!userId || !actorId) {
    return null;
  }

  if (userId.toString() === actorId.toString()) {
    return null;
  }

  const notification = await Notification.create({
    userId,
    actorId,
    type,
    targetPostId,
    targetCommentId,
    data,
  });

  return notification;
};
//mai thay = gui qua socket
export const emitStub = async (notificationDoc) => {
  console.log(`Gui den User ${notificationDoc.userId} - Type: ${notificationDoc.type}`);
};

export const createAndEmit = async (payload) => {
  const notification = await createNotification(payload);
  
  if (notification) {
    await emitStub(notification);
  }
  
  return notification;
};

export default {
  createNotification,
  createAndEmit,
  emitStub,
};
