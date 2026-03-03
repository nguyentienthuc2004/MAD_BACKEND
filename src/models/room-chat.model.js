import mongoose from "mongoose";

const roomChatSchema = new mongoose.Schema(
    {
        title: String,
        avatar: String,
        typeRoom: String, // Ví dụ: "group" hoặc "friend"
        status: String,
        users: [{
            user_id: String,
            nickname: String,
            role: String, // owner // co_owner //member
        }],
        participantsHash: String, // Chống tạo trùng
        lastMessage: {
            content: String,
            sender: String, // UserId của người gửi
            createdAt: Date
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: Date
    },
    {
        timestamps: true,
    })

const RoomChat = mongoose.model("RoomChat", roomChatSchema, "rooms-chat");
roomChatSchema.index(
    { participantsHash: 1 },
    { unique: true }
);
export default RoomChat;
