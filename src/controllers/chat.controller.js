import User from "../models/user.model.js";
import RoomChat from "../models/room-chat.model.js";
import Message from "../models/message.model.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";
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
        const userId = req.user.userId;

        const rooms = await RoomChat.find({
            "users.user_id": userId,
            isDeleted: false,
        }).sort({ updatedAt: -1 });

        // Tính số tin nhắn chưa đọc cho từng phòng dựa trên collection Message
        const roomsWithUnread = await Promise.all(
            rooms.map(async (room) => {
                const unreadCount = await Message.countDocuments({
                    room_id: room._id,
                    sender_id: { $ne: userId },
                    isDeleted: false,
                    read_by: {
                        $not: {
                            $elemMatch: {
                                user_id: userId,
                            },
                        },
                    },
                });

                const roomObj = room.toObject();
                return {
                    ...roomObj,
                    unreadCount,
                };
            }),
        );

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách phòng chat thành công",
            data: { rooms: roomsWithUnread },
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
        const before = req.query.before;
        const keyword = req.query.keyword

        const room = await RoomChat.findOne({
            _id: roomId,
            isDeleted: false,
            "users.user_id": userId
        })
        if (!room) {
            return res.status(403).json({ message: "Không có phòng chat" })
        }
        const filter = {
            room_id: roomId,
        };
        if (keyword) {
            const regex = new RegExp(keyword, 'i');
            filter.content = regex
        }

        if (before) {
            filter.createdAt = { $lt: new Date(before) };
        }
        const messages = await Message.find(filter)
            .sort({ createdAt: -1 })
            .limit(20);

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
        const { content, replyMessageId } = req.body;
        const roomId = req.params.roomId;
        const userId = req.user.userId;

        if (!content || typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Nội dung tin nhắn không hợp lệ",
            });
        }

        const room = await RoomChat.findOne({
            _id: roomId,
            isDeleted: false
        });
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

        // Nếu có replyMessageId, đảm bảo tin nhắn gốc tồn tại trong cùng room
        let replyMessage = null;
        if (replyMessageId) {
            replyMessage = await Message.findOne({
                _id: replyMessageId,
                room_id: roomId,
                isDeleted: false,
            });

            if (!replyMessage) {
                return res.status(400).json({
                    success: false,
                    message: "Tin nhắn được trả lời không hợp lệ",
                });
            }
        }

        const message = await Message.create({
            sender_id: userId,
            room_id: roomId,
            content: content,
            replyToMessage: replyMessage ? replyMessage._id : null,
        });
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
            await message.updateOne({
                status: "delivered"
            })
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
// [PATCH] api/chat/rooms/:roomId/users/:userId/nickname
export const editNickname = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const userId = req.params.userId;//Người bị thay đổi 
        const { nickname } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu userId của thành viên cần đổi biệt danh",
            });
        }
        let safeNickname =
            typeof nickname === "string" ? nickname.trim() : "";

        if (!safeNickname) {
            const targetUser = await User.findOne({
                _id: userId,
                isDeleted: false,
            }).select("username");

            safeNickname = targetUser?.username || "";
        }

        const updatedRoom = await RoomChat.findOneAndUpdate(
            {
                _id: roomId,
                isDeleted: false,
                "users.user_id": userId,
            },
            {
                $set: { "users.$.nickname": safeNickname },
            },
            { new: true },
        );

        if (!updatedRoom) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phòng chat hoặc thành viên trong phòng",
            });
        }

        // SERVER_NICKNAME_CHANGED
        try {
            const io = req.app.get("io");
            if (io) {
                const changerId = req.user.userId;

                // Tìm thông tin người đổi và người bị đổi trong room sau khi update
                const changerMember = changerId
                    ? updatedRoom.users.find(
                        (u) => String(u.user_id) === String(changerId),
                    )
                    : null;
                const targetMember = updatedRoom.users.find(
                    (u) => String(u.user_id) === String(userId),
                );

                const payload = {
                    roomId: String(roomId),
                    changerId: changerId ? String(changerId) : undefined,
                    changerName: changerMember?.nickname || "Một người dùng",
                    targetId: String(userId),
                    targetName: targetMember?.nickname || "một thành viên",
                    newNickname: safeNickname,
                };

                io.to(String(roomId)).emit("SERVER_NICKNAME_CHANGED", payload);
            }
        } catch (socketError) {
            console.error("Emit SERVER_NICKNAME_CHANGED error:", socketError);
        }

        return res.status(200).json({
            success: true,
            message: "Cập nhật biệt danh thành công",
            data: { room: updatedRoom },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi Server",
            error: error.message,
        });
    }
};
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
    try {
        const roomId = req.params.roomId;
        const userId = req.user.userId;
        const room = await RoomChat.findOne({
            _id: roomId,
            isDeleted: false
        });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Phòng chat không tồn tại"
            });
        }
        // Chỉ cho phép thành viên nhóm xem
        const isMember = room.users.some(u => String(u.user_id) === String(userId));
        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Bạn không phải thành viên nhóm này"
            });
        }
        // Trả về danh sách users (ẩn các trường nhạy cảm nếu có)
        return res.status(200).json({
            success: true,
            data: {
                users: room.users.map(u => ({
                    user_id: u.user_id,
                    nickname: u.nickname,
                    avatar: u.avatar,
                    role: u.role
                }))
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ",
            details: error.message,
        });
    }
}

// [PATCH] api/chat/:roomId/seen
export const seenMessage = async (req, res) => {
    const userId = req.user.userId;
    const roomId = req.params.roomId;

    try {
        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu roomId"
            });
        }
        const room = await RoomChat.findOne({
            _id: roomId,
            isDeleted: false,
            "users.user_id": userId,
        });

        if (!room) {
            return res.status(403).json({
                success: false,
                message: "Bạn không thuộc phòng chat này",
            });
        }
        const result = await Message.updateMany({
            room_id: roomId,
            sender_id: { $ne: userId },
            isDeleted: false,
            read_by: {
                $not: {
                    $elemMatch: {
                        user_id: userId
                    }
                }
            }

        }, {
            $push: {
                read_by: {
                    user_id: userId,
                    read_at: new Date()
                }
            },

        })
        const io = req.app.get("io");
        if (io) {
            const now = new Date();
            io.to(String(roomId)).emit("SERVER_MESSAGES_SEEN", {
                roomId: String(roomId),
                userId: String(userId),
                seenAt: now,
            });
        }
        return res.status(200).json({
            success: true,
            message: `Đã đọc ${result.modifiedCount} tin nhắn`,

        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ",
            details: error.message,
        });
    }
}
// [POST] api/chat/rooms/:roomId/messages
export const sendImage = async (req, res) => {
    const userId = req.user.userId;
    const roomId = req.params.roomId;
    try {
        const room = await RoomChat.findOne({
            _id: roomId,
            "users.user_id": userId,
            isDeleted: false
        });
        if (!room) {
            return res.status(400).json({
                success: false,
                message: "Phòng chat không tồn tại",
            });
        }

        const files = req.files || [];

        if (!files.length) {
            return res.status(400).json({
                success: false,
                message: "Không có ảnh nào được gửi",
            });
        }

        const uploadedImages = await Promise.all(
            files.map(async (file) => {
                const uploaded = await uploadBufferToCloudinary(file.buffer, "images");
                return uploaded.secure_url;
            })
        );
        const message = await Message.create({
            sender_id: userId,
            room_id: roomId,
            images: uploadedImages,
        });

        await RoomChat.updateOne(
            {
                _id: roomId,
                isDeleted: false,
            },
            {
                lastMessage: {
                    content: "[Hình ảnh]",
                    sender: userId,
                    createdAt: message.createdAt,
                },
            },
        );

        const io = req.app.get("io");
        if (io) {
            io.to(String(roomId)).emit("SERVER_SEND_MESSAGE", message);
            await message.updateOne({ status: "delivered" });
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
// [DELETE] api/chat/rooms/:roomId/messages/:messageId
export const deleteMessage = async (req, res) => {
    const userId = req.user.userId;
    const roomId = req.params.roomId;
    try {
        const room = await RoomChat.findOne({
            _id: roomId,
            "users.user_id": userId,
            isDeleted: false
        });
        if (!room) {
            return res.status(400).json({
                success: false,
                message: "Phòng chat không tồn tại",
            });
        }
        const messageId = req.params.messageId
        if (!messageId) {
            return res.status(400).json({
                success: false,
                message: "Tin nhắn không tồn tại",
            });
        }
        const result = await Message.updateOne({
            _id: messageId,
            sender_id: userId,
            isDeleted: false,
            room_id: roomId
        }, {
            isDeleted: true,
            deletedAt: new Date(),
        });
        await RoomChat.updateOne(
            {
                _id: roomId,
                isDeleted: false,
            },
            {
                lastMessage: {
                    content: "Một tin nhắn đã bị xoá",
                    sender: userId,
                    createdAt: new Date(),
                },
            },
        );
        const io = req.app.get("io");
        if (io) {
            io.to(String(roomId)).emit("SERVER_MESSAGE_DELETED", {
                roomId: String(roomId),
                messageId: String(messageId),
                deletedBy: String(userId),
            });
        }
        return res.status(204).json({
            success: true,
            message: "Xoá tin nhắn thành công",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ",
            details: error.message,
        });
    }
}
// [PATCH] api/chat/groups/:roomId/member/:userId/role
export const changeMemberRole = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const targetUserId = req.params.userId;
        const { newRole } = req.body; // newRole: 'owner' | 'co_owner' | 'member'
        const userId = req.user.userId;

        if (!['owner', 'co_owner', 'member'].includes(newRole)) {
            return res.status(400).json({
                success: false,
                message: "Role không hợp lệ"
            });
        }

        const room = await RoomChat.findOne({
            _id: roomId,
            isDeleted: false
        });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Phòng chat không tồn tại"
            });
        }
        if (room.typeRoom !== 'group') {
            return res.status(400).json({
                success: false,
                message: "Chỉ nhóm chat mới đổi được role"
            });
        }
        // Kiểm tra userId là owner
        const changer = room.users.find(u => String(u.user_id) === String(userId));
        if (!changer || changer.role !== 'owner') {
            return res.status(403).json({
                success: false,
                message: "Chỉ owner mới có quyền thay đổi role thành viên"
            });
        }
        // Không cho tự đổi role của mình thành non-owner (phải chuyển owner cho người khác)
        if (String(userId) === String(targetUserId) && newRole !== 'owner') {
            return res.status(400).json({
                success: false,
                message: "Owner không thể tự hạ quyền của mình, hãy chuyển owner cho người khác"
            });
        }
        // Tìm thành viên cần đổi role
        const target = room.users.find(u => String(u.user_id) === String(targetUserId));
        if (!target) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thành viên trong nhóm"
            });
        }
        // Nếu chuyển owner
        if (newRole === 'owner') {
            if (target.role === 'owner') {
                return res.status(400).json({
                    success: false,
                    message: "Người này đã là owner"
                });
            }
            // Chuyển owner: target thành owner, owner cũ thành co_owner
            room.users = room.users.map(u => {
                if (String(u.user_id) === String(userId)) {
                    return { ...u, role: 'co_owner' };
                }
                if (String(u.user_id) === String(targetUserId)) {
                    return { ...u, role: 'owner' };
                }
                return u;
            });
        } else {
            // Đổi role thường (không phải owner)
            if (target.role === newRole) {
                return res.status(400).json({
                    success: false,
                    message: `Thành viên đã có role ${newRole}`
                });
            }
            // Không cho hạ owner thành non-owner qua API này
            if (target.role === 'owner') {
                return res.status(400).json({
                    success: false,
                    message: "Không thể hạ quyền owner bằng API này, hãy chuyển owner cho người khác"
                });
            }
            room.users = room.users.map(u => {
                if (String(u.user_id) === String(targetUserId)) {
                    return { ...u, role: newRole };
                }
                return u;
            });
        }
        await room.save();

        // Emit socket event nếu cần
        try {
            const io = req.app.get("io");
            if (io) {
                io.to(String(roomId)).emit("SERVER_MEMBER_ROLE_CHANGED", {
                    roomId: String(roomId),
                    changerId: String(userId),
                    targetId: String(targetUserId),
                    newRole,
                });
            }
        } catch (socketError) {
            console.error("Emit SERVER_MEMBER_ROLE_CHANGED error:", socketError);
        }

        return res.status(200).json({
            success: true,
            message: "Cập nhật role thành công",
            data: { users: room.users }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ",
            details: error.message,
        });
    }
};
// [DELETE] api/chat/groups/:roomId/member/:userId
export const removeMember = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const targetUserId = req.params.userId;
        const userId = req.user.userId;
        const room = await RoomChat.findOne({
            _id: roomId,
            isDeleted: false
        });
        if (!room) {
            return res.status(404).json({ success: false, message: "Phòng chat không tồn tại" });
        }
        if (room.typeRoom !== 'group') {
            return res.status(400).json({ success: false, message: "Chỉ nhóm chat mới được xoá thành viên" });
        }
        const changer = room.users.find(u => String(u.user_id) === String(userId));
        if (!changer || changer.role !== 'owner') {
            return res.status(403).json({ success: false, message: "Chỉ owner mới có quyền xoá thành viên" });
        }
        if (String(userId) === String(targetUserId)) {
            return res.status(400).json({ success: false, message: "Không thể tự xoá chính mình khỏi nhóm" });
        }
        const target = room.users.find(u => String(u.user_id) === String(targetUserId));
        if (!target) {
            return res.status(404).json({ success: false, message: "Không tìm thấy thành viên trong nhóm" });
        }
        if (target.role === 'owner') {
            return res.status(400).json({ success: false, message: "Không thể xoá owner khỏi nhóm" });
        }
        room.users = room.users.filter(u => String(u.user_id) !== String(targetUserId));
        await room.save();
        // Emit socket event nếu cần
        try {
            const io = req.app.get("io");
            if (io) {
                io.to(String(roomId)).emit("SERVER_MEMBER_REMOVED", {
                    roomId: String(roomId),
                    changerId: String(userId),
                    targetId: String(targetUserId),
                });
            }
        } catch (socketError) {
            console.error("Emit SERVER_MEMBER_REMOVED error:", socketError);
        }
        return res.status(200).json({ success: true, message: "Đã xoá thành viên khỏi nhóm", data: { users: room.users } });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi máy chủ", details: error.message });
    }
};