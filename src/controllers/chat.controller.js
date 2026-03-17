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
        const receiver = await User.findById(receiverId).select("username avatarUrl");
        const sender = await User.findById(userId).select("username avatarUrl");
        const room = await RoomChat.create({
            typeRoom: "friend",
            isDeleted: false,
            participantsHash: hash,
            users: [
                {
                    user_id: sender._id,
                    nickname: sender.username,
                    avatar: sender.avatarUrl,
                    role: "owner"
                },
                {
                    user_id: receiver._id,
                    nickname: receiver.username,
                    avatar: receiver.avatarUrl,
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
        const userId = req.user.userId
        const roomId = req.params.roomId
        const room = await RoomChat.findOne({
            _id: roomId,
            isDeleted: false,
            "users.user_id": userId
        })
        if (!room) {
            return res.status(403).json({ message: "Không có phòng chat" })
        }
        const messages = await Message.find({
            room_id: roomId,
            isDeleted: false
        }).sort({ createdAt: -1 }).limit(20)
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
            user => user.user_id.toString() === userId.toString()
        );
        if (!isMember) {
            return res.status(400).json({
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
        // Socket io 
        const io = req.app.get("io");
        if (io) {
            io.to(String(roomId)).emit("SERVER_SEND_MESSAGE", message);
        }

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
// [PATCH] api/chat/rooms/:roomId/users/nicknames
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
// [POST] api/chat/groups
export const createGroup = async (req, res) => {
    const { title, avatar, usersId } = req.body
    const userId = req.user.userId
    try {
        if (!title) {
            return res.status(400).json({ message: "Chưa đặt tên cho nhóm" })
        }
        if (!Array.isArray(usersId) || usersId.length === 0) {
            return res.status(400).json({ message: "Danh sách thành viên không hợp lệ" });
        }
        // Loại bỏ id của mình nếu có
        const filteredUserIds = usersId.filter(id => id.toString() !== userId.toString());
        const users = []
        const myUser = await User.findOne({
            _id: userId,
            isDeleted: false
        }).select("-password")
        if (myUser) {
            users.push({
                user_id: myUser.id,
                nickname: myUser.username,
                avatar: myUser.avatarUrl,
                role: "owner" // owner // co_owner //member
            })
        }
        for (const id of filteredUserIds) {
            const user = await User.findOne({
                _id: id,
                isDeleted: false
            }).select("-password")
            if (user) {
                users.push({
                    user_id: user.id,
                    nickname: user.username,
                    avatar: user.avatarUrl,
                    role: "member" // owner // co_owner //member
                })
            }
        }

        const group = await RoomChat.create({
            title: title,
            avatar: avatar || "",
            typeRoom: "group",
            isDeleted: false,
            users: users
        });
        return res.status(201).json({
            success: true,
            message: "Tạo nhóm chat thành công",
            data: { group },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ",
            details: error.message,
        });
    }
}

// [PATCH] api/chat/room/:roomId
export const editRoom = async (req, res) => {
    const roomId = req.params.roomId
    try {
        const room = await RoomChat.findOne({
            _id: roomId,
            isDeleted: false
        })
        if (room.typeRoom !== "group") {
            return res.status(400).json({ message: "Phòng chat không hợp lệ" })
        }
        const { title, avatar } = req.body
        if (!title) {
            title = room.title
        }
        if (!avatar) {
            avatar = room.avatar
        }
        const userId = req.user.userId
        const member = room.users.find(
            user => user.user_id.toString() === userId.toString()
        )
        if (!member) {
            return res.status(200).json({ message: "Người này không có trong đoạn chat" })
        }
        if (member.role !== "owner" && member.role !== "co_owner") {
            return res.status(200).json({ message: "Người này không có quyền thực hiện" })
        }
        await RoomChat.updateOne({
            _id: roomId,
            isDeleted: false
        }, {
            title: title,
            avatar: avatar
        })
        return res.status(200).json({
            message: "Thay đổi thành công",
            data: room
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ",
            details: error.message,
        });
    }

}

// [GET] api/chat/room/:roomId/member
export const getMember = async (req, res) => {

}
