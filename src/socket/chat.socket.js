import RoomChat from "../models/room-chat.model.js";

/**
 * Đăng ký các handler socket cho chat
 * - JOIN_ROOM: kiểm tra user có thuộc room không rồi mới cho join
 */
export const registerChatSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("Socket connected", socket.id);

        socket.on("JOIN_ROOM", async (payload) => {
            try {
                const { roomId, userId } = payload || {};
                if (!roomId || !userId) return;

                const room = await RoomChat.findOne({
                    _id: roomId,
                    isDeleted: false,
                    "users.user_id": userId,
                });

                if (!room) return;

                socket.join(String(roomId));
            } catch (error) {
                console.error("JOIN_ROOM error:", error?.message || error);
            }
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected", socket.id);
        });
    });
};
