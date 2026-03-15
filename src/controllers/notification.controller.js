import mongoose from "mongoose";
import Notification from "../models/notification.model.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { unreadOnly = "false" } = req.query;

    const query = { userId };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ updatedAt: -1 })
      .populate("actors", "username avatar")
      .populate("lastActor", "username avatar")
      .populate("targetPostId", "caption images")
      .populate("targetCommentId", "content")
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        unreadCount,
        notifications,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    if (!isValidObjectId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID format",
      });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    if (!isValidObjectId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID format",
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const count = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
