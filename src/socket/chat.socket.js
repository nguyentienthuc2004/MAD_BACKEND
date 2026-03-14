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
                const roomId =
                    typeof payload === "string" ? payload : payload?.roomId;
                const userId =
                    typeof payload === "object" && payload !== null
                        ? payload.userId
                        : undefined;

                if (!roomId || !userId) {
                    console.log("JOIN_ROOM invalid payload", payload);
                    return;
                }

                const room = await RoomChat.findOne({
                    _id: roomId,
                    isDeleted: false,
                    "users.user_id": userId,
                });

                if (!room) {
                    console.log("JOIN_ROOM denied", { roomId, userId });
                    return;
                }

                socket.join(String(roomId));
                console.log("JOIN_ROOM success", { socketId: socket.id, roomId, userId });
            } catch (error) {
                console.error("JOIN_ROOM error:", error?.message || error);
            }
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected", socket.id);
        });
    });
};
