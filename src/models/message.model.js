import mongoose from "mongoose";
const MessageSchema = new mongoose.Schema({
    sender_id: String,
    room_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoomChat',
        required: true,
        index: true
    },
    content: String,
    images: Array,
    read_by: [{
        user_id: String,
        read_at: { type: Date, default: Date.now }
    }],
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: Date
}, {
    timestamps: true
});

const Message = mongoose.model('Message', MessageSchema, "messages")
export default Message;
MessageSchema.index({
    room_id: 1,
    sender_id: 1,
    "read_by.user_id": 1,
    isDeleted: 1
});