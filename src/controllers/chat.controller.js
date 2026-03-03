import User from "../models/User.js";
import RoomChat from "../models/room-chat.model.js";
import Message from "../models/message.model.js";


export const postRoomChat = async (req, res) => {
    try {
        const receiverId = req.body.receiverId
        const userId = req.body.userId
        if (!receiverId) {
            return res.status(400).json({ message: "Thiếu id  người yêu cầu" })
        }
        if (receiverId === userId) {
            return res.status(400).json({ message: "Không thể chat với bản thân" })
        }
        let hash = [userId, receiverId].sort().join("_");
        const existingRoom = await RoomChat.findOne({
            participantsHash: hash,
            isDeleted: false
        });
        if (existingRoom) {
            return res.status(200).json({
                message: "Phòng đã tồn tại",
                room: existingRoom
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
        return res.status(201).json(room);
    } catch (error) {
        if (error.code === 11000) {
            const existingRoom = await RoomChat.findOne({
                participantsHash: hash,
                isDeleted: false
            });
            return res.status(200).json({
                message: "Phòng đã có",
                existingRoom: existingRoom
            });
        }
        return res.status(500).json({ message: error.message });
    }
};

export const getRoomChat = async (req, res) => {
    try {
        // const userId = req.user.userId
        const userId = req.body.userId
        const rooms = await RoomChat.find({
            "users.user_id": userId,
            isDeleted: false
        }).sort({ updatedAt: -1 })

        return res.status(200).json(rooms)
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
// [GET] chat/rooms/:roomId/messages"
export const getMessage = async (req, res) => {
    try {
        const roomId = req.params.roomId
        const messages = await Message.find({
            room_id: roomId,
            isDeleted: false
        }).sort({ createAt: -1 }).limit(10)
        return res.status(200).json(messages);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

