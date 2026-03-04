import User from "../models/user.model.js";
import RoomChat from "../models/room-chat.model.js";
import Message from "../models/message.model.js";

// [POST] api/chat/rooms
export const postRoomChat = async (req, res) => {
    try {
        const receiverId = req.body.receiverId
        const userId = req.user.userId
        if (!receiverId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu id người yêu cầu",
            });
        }
        if (receiverId === userId) {
            return res.status(400).json({
                success: false,
                message: "Không thể chat với bản thân",
            });
        }
        let hash = [userId, receiverId].sort().join("_");
        const existingRoom = await RoomChat.findOne({
            participantsHash: hash,
            isDeleted: false
        });
        if (existingRoom) {
            return res.status(200).json({
                success: true,
                message: "Phòng đã tồn tại",
                data: { room: existingRoom },
            });
        }
        const receiver = await User.findById(receiverId).select("displayName");
        const sender = await User.findById(userId).select("displayName");
        const room = await RoomChat.create({
            typeRoom: "friend",
            isDeleted: false,
            participantsHash: hash,
            users: [
                {
                    user_id: sender._id,
                    nickname: sender.displayName,
                    role: "owner"
                },
                {
                    user_id: receiver._id,
                    nickname: receiver.displayName,
                    role: "owner"
                }
            ]
        });
        return res.status(201).json({
            success: true,
            message: "Tạo phòng chat thành công",
            data: { room },
        });
    } catch (error) {
        if (error.code === 11000) {
            const existingRoom = await RoomChat.findOne({
                participantsHash: hash,
                isDeleted: false
            });
            return res.status(200).json({
                success: true,
                message: "Phòng đã tồn tại",
                data: { room: existingRoom },
            });
        }
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ",
            details: error.message,
        });
    }
};
// [GET] api/chat/rooms
export const getRoomChat = async (req, res) => {
    try {
        const userId = req.user.userId
        // const userId = req.body.userId
        const rooms = await RoomChat.find({
            "users.user_id": userId,
            isDeleted: false
        }).sort({ updatedAt: -1 })

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách phòng chat thành công",
            data: { rooms },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ",
            details: error.message,
        });
    }
};
// [GET] api/chat/rooms/:roomId/messages
export const getMessage = async (req, res) => {
    try {
        const roomId = req.params.roomId
        const messages = await Message.find({
            room_id: roomId,
            isDeleted: false
        }).sort({ createdAt: -1 }).limit(10)
        return res.status(200).json({
            success: true,
            message: "Lấy danh sách tin nhắn thành công",
            data: { messages },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ",
            details: error.message,
        });
    }
};

// [POST] api/chat/rooms/:roomId/messages
export const sendMessage = async (req, res) => {
    try {
        const { content } = req.body
        const roomId = req.params.roomId
        const userId = req.user.userId

        if (!content || typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Nội dung tin nhắn không hợp lệ",
            });
        }
        const room = await RoomChat.findOne({
            _id: roomId,
            isDeleted: false
        })
        if (!room) {
            return res.status(400).json({
                success: false,
                message: "Phòng chat không tồn tại",
            });
        }
        const isMember = room.users.some(
            user => user.user_id.toString() === userId
        );
        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Bạn không thuộc phòng chat này",
            });
        }
        const message = await Message.create({
            sender_id: userId,
            room_id: roomId,
            content: content,
        })
        await RoomChat.updateOne({
            _id: roomId,
            isDeleted: false
        }, {
            lastMessage: {
                content: content,
                sender: userId, // UserId của người gửi
                createdAt: message.createdAt
            },
        })
        return res.status(201).json({
            success: true,
            message: "Gửi tin nhắn thành công",
            data: { message },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ",
            details: error.message,
        });
    }

}
// [PATCH] api/rooms/:roomId/users/nicknames
export const editNickname = async (req, res) => {
    try {
        const roomId = req.params.roomId
        const { nicknames } = req.body

        if (!Array.isArray(nicknames) || nicknames.length === 0) {
            return res.status(400).json({ message: "Dữ liệu nicknames không hợp lệ" });
        }
        const bulkOps = nicknames.map((item) => ({
            updateOne: {
                filter: { _id: roomId, "users.user_id": item.userId },
                update: { $set: { "users.$.nickname": item.nickname } }
            }
        }))
        const result = await RoomChat.bulkWrite(bulkOps)
        const roomChat = await RoomChat.findOne({
            _id: roomId,
            isDeleted: false
        })
        return res.status(200).json({
            success: true,
            message: "Cập nhật thành công",
            data: roomChat
        })
    } catch (error) {
        return res.status(500).json({ message: "Lỗi Server", error: error.message });
    }
}
