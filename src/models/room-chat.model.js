import mongoose from "mongoose";

const roomChatSchema = new mongoose.Schema(
    {
        title: String,
        avatar: String,
        typeRoom: String, // Ví dụ: "group" hoặc "friend"
        status: String,
        users: [{
            _id: false,
            user_id: String,
            nickname: String,
            avatar: String,
            role: {
                type: String,
                enum: ['owner', 'member', 'co_owner'],
                default: 'owner'
            }, // owner // co_owner //member
        }],
        participantsHash: { type: String, unique: true }, // Chống tạo trùng
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
