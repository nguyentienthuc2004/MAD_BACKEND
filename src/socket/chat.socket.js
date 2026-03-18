import RoomChat from "../models/room-chat.model.js";


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

        // User đang nhập trong phòng chat
        socket.on("CLIENT_TYPING", (payload) => {
            try {
                const roomId =
                    typeof payload === "string" ? payload : payload?.roomId;
                const userId =
                    typeof payload === "object" && payload !== null
                        ? payload.userId
                        : undefined;
                const name =
                    typeof payload === "object" && payload !== null
                        ? payload.name
                        : undefined;

                if (!roomId || !userId) {
                    console.log("CLIENT_TYPING invalid payload", payload);
                    return;
                }

                const roomKey = String(roomId);

                // Đảm bảo socket đã join room này trước đó
                if (!socket.rooms.has(roomKey)) {
                    console.log("CLIENT_TYPING ignored, socket not in room", {
                        socketId: socket.id,
                        roomId: roomKey,
                        userId,
                    });
                    return;
                }

                // Chỉ gửi cho các client khác trong room
                socket.to(roomKey).emit("SERVER_TYPING", {
                    roomId: roomKey,
                    userId,
                    name,
                });
            } catch (error) {
                console.error("CLIENT_TYPING error:", error?.message || error);
            }
        });

        socket.on("CLIENT_STOP_TYPING", (payload) => {
            try {
                const roomId =
                    typeof payload === "string" ? payload : payload?.roomId;
                const userId =
                    typeof payload === "object" && payload !== null
                        ? payload.userId
                        : undefined;

                if (!roomId || !userId) {
                    console.log("CLIENT_STOP_TYPING invalid payload", payload);
                    return;
                }

                const roomKey = String(roomId);

                if (!socket.rooms.has(roomKey)) {
                    console.log("CLIENT_STOP_TYPING ignored, socket not in room", {
                        socketId: socket.id,
                        roomId: roomKey,
                        userId,
                    });
                    return;
                }

                socket.to(roomKey).emit("SERVER_STOP_TYPING", {
                    roomId: roomKey,
                    userId,
                });
            } catch (error) {
                console.error("CLIENT_STOP_TYPING error:", error?.message || error);
            }
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected", socket.id);
        });
    });
};

