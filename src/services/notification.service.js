import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import { emitToUser } from "../socket/notification.socket.js";

export async function upsertActorNotification({
  userId,
  actorId,
  type,
  targetPostId = null,
  targetCommentId = null,
  data = {},
}) {
  if (!userId || !actorId) {
    throw new Error("userId and actorId are required");
  }

  if (String(userId) === String(actorId)) {
    return { action: "ignored", notification: null };
  }

  const match = {
    userId: new mongoose.Types.ObjectId(userId),
    type,
    targetPostId: targetPostId ? new mongoose.Types.ObjectId(targetPostId) : null,
    targetCommentId: targetCommentId ? new mongoose.Types.ObjectId(targetCommentId) : null,
  };

  const update = {
    $addToSet: { actors: new mongoose.Types.ObjectId(actorId) },
    // mark unread when new actor/activity arrives
    $set: { lastActor: new mongoose.Types.ObjectId(actorId), data, isRead: false },
    $currentDate: { updatedAt: true },
  };

  const raw = await Notification.findOneAndUpdate(match, update, {
    new: true,
    upsert: true,
    rawResult: true,
    setDefaultsOnInsert: true,
  });

  let doc = raw.value;
  if (!doc) {
    const upsertedId = raw.lastErrorObject && raw.lastErrorObject.upserted;
    if (upsertedId) {
      doc = await Notification.findById(upsertedId).lean();
    } else {
      doc = await Notification.findOne(match).lean();
    }
  }
  if (!doc) {
    throw new Error("Notification upsert failed: no document returned");
  }

  const actorsLen = Array.isArray(doc.actors) ? doc.actors.length : 0;
  if ((doc.count ?? 0) !== actorsLen) {
    await Notification.findByIdAndUpdate(doc._id, { count: actorsLen });
  }

  const populated = await Notification.findById(doc._id)
    .populate("actors", "username avatarUrl")
    .populate("lastActor", "username avatarUrl")
    .lean();

  try {
    const created = !!raw.lastErrorObject && raw.lastErrorObject.upserted;
    if (created) {
      await emitToUser(String(userId), "notification:new", { action: "created", notification: populated });
    } else {
      await emitToUser(String(userId), "notification:update", { action: "updated", notification: populated });
    }

    const unreadCount = await Notification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), isRead: false });
    await emitToUser(String(userId), "notification:unread_count", { unreadCount });
  } catch (e) {
    console.error("emit error (upsert):", e);
  }

  return { action: "upserted", notification: populated };
}

export async function removeActorFromNotification({
  userId,
  actorId,
  type,
  targetPostId = null,
  targetCommentId = null,
}) {
  if (!userId || !actorId) {
    throw new Error("userId and actorId are required");
  }

  if (String(userId) === String(actorId)) {
    return { action: "ignored", notification: null };
  }

  const match = {
    userId: new mongoose.Types.ObjectId(userId),
    type,
    targetPostId: targetPostId ? new mongoose.Types.ObjectId(targetPostId) : null,
    targetCommentId: targetCommentId ? new mongoose.Types.ObjectId(targetCommentId) : null,
  };

  const existing = await Notification.findOne({ ...match, actors: new mongoose.Types.ObjectId(actorId) });
  if (!existing) {
    return { action: "not_found", notification: null };
  }

  if ((existing.count ?? 0) <= 1) {
    await Notification.deleteOne({ _id: existing._id });

    try {
      const unreadCount = await Notification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), isRead: false });
      await emitToUser(String(userId), "notification:unread_count", { unreadCount });
      await emitToUser(String(userId), "notification:removed", { targetPostId, targetCommentId, type });
    } catch (e) {}

    return { action: "removed", notification: null };
  }

  const updated = await Notification.findByIdAndUpdate(
    existing._id,
    {
      $pull: { actors: new mongoose.Types.ObjectId(actorId) },
      $inc: { count: -1 },
      $currentDate: { updatedAt: true },
    },
    { new: true },
  );

  const populated = await Notification.findById(updated._id)
    .populate("actors", "username avatarUrl")
    .populate("lastActor", "username avatarUrl")
    .lean();

  try {
    await emitToUser(String(userId), "notification:update", { action: "updated", notification: populated });
    const unreadCount = await Notification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), isRead: false });
    await emitToUser(String(userId), "notification:unread_count", { unreadCount });
  } catch (e) {}

  return { action: "updated", notification: populated };
}

export default {
  upsertActorNotification,
  removeActorFromNotification,
};
