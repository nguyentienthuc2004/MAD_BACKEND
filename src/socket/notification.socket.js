let notificationIo = null;

export const registerNotificationSocket = (io) => {
  notificationIo = io;

  io.on("connection", (socket) => {
    console.log("Notification socket connected", socket.id);

    socket.on("JOIN_USER", (payload) => {
      try {
        const userId = typeof payload === "string" ? payload : payload?.userId;
        if (!userId) {
          console.log("JOIN_USER invalid payload", payload);
          return;
        }

        socket.join(`user:${userId}`);
        console.log("JOIN_USER success", { socketId: socket.id, userId });
      } catch (e) {
        console.error("JOIN_USER error:", e?.message || e);
      }
    });

    socket.on("disconnect", () => {
      console.log("Notification socket disconnected", socket.id);
    });
  });
};

export const emitToUser = async (userId, event, data) => {
  try {
    if (!notificationIo) return;
    notificationIo.to(`user:${userId}`).emit(event, data);
  } catch (e) {
    console.error("emitToUser error:", e?.message || e);

  }
};

export default {
  registerNotificationSocket,
  emitToUser,
};
