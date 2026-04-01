import express from "express";
import { getRoomChat, removeMember, leaveGroup, postRoomChat, getMessage, sendMessage, changeMemberRole, deleteMessage, editNickname, createGroup, seenMessage, editRoom, getMember, addMemberToGroup, sendImage, deleteRoomChatForUser, changeRoomTitle, changeRoomAvatar } from "../controllers/chat.controller.js";
import upload from "../middleware/upload.middleware.js";
import { Route } from "express";
const router = express.Router();

/**
 * @swagger
 * /api/chat/rooms:
 *   get:
 *     summary: Lấy danh sách phòng chat của user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách phòng chat thành công
 *       401:
 *         description: Unauthorized
 */
router.get("/rooms", getRoomChat);

/**
 * @swagger
 * /api/chat/rooms:
 *   post:
 *     summary: Tạo phòng chat mới (friend)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: ID người nhận
 *     responses:
 *       201:
 *         description: Tạo phòng chat thành công
 *       400:
 *         description: Thiếu id hoặc không thể chat với bản thân
 *       401:
 *         description: Unauthorized
 */
router.post("/rooms", postRoomChat);


/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages:
 *   get:
 *     summary: Lấy danh sách tin nhắn trong phòng chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Lấy các tin nhắn trước thời điểm này (ISO date)
 *     responses:
 *       200:
 *         description: Lấy danh sách tin nhắn thành công
 *       401:
 *         description: Unauthorized
 */
router.get("/rooms/:roomId/messages", getMessage)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages:
 *   post:
 *     summary: Gửi tin nhắn mới vào phòng chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Nội dung tin nhắn
 *               replyMessageId:
 *                 type: string
 *                 description: ID tin nhắn được trả lời (nếu có)
 *     responses:
 *       201:
 *         description: Gửi tin nhắn thành công
 *       400:
 *         description: Nội dung không hợp lệ
 *       401:
 *         description: Unauthorized
 */
router.post("/rooms/:roomId/messages", sendMessage)

/**
 * @swagger
 * /api/chat/rooms/{roomId}/users/{userId}/nickname:
 *   patch:
 *     summary: Đổi biệt danh thành viên trong phòng chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: Biệt danh mới
 *     responses:
 *       200:
 *         description: Cập nhật biệt danh thành công
 *       400:
 *         description: Thiếu userId hoặc nickname không hợp lệ
 *       401:
 *         description: Unauthorized
 */
router.patch("/rooms/:roomId/users/:userId/nickname", editNickname)

/**
 * @swagger
 * /api/chat/groups:
 *   post:
 *     summary: Tạo nhóm chat mới
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Tên nhóm
 *               avatar:
 *                 type: string
 *                 description: Ảnh đại diện nhóm (tùy chọn)
 *               usersId:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách userId thành viên
 *     responses:
 *       201:
 *         description: Tạo nhóm chat thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Unauthorized
 */
router.post("/groups", createGroup);

router.patch("/rooms/:roomId", editRoom);

/**
 * @swagger
 * /api/chat/rooms/{roomId}:
 *   patch:
 *     summary: Đổi tên, avatar phòng chat nhóm
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Tên mới
 *               avatar:
 *                 type: string
 *                 description: Ảnh đại diện mới
 *     responses:
 *       200:
 *         description: Thay đổi thành công
 *       400:
 *         description: Phòng chat không hợp lệ
 *       401:
 *         description: Unauthorized
 */
router.patch("/rooms/:roomId", editRoom);

/**
 * @swagger
 * /api/chat/groups/{roomId}/member:
 *   get:
 *     summary: Lấy danh sách thành viên nhóm
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Lấy danh sách thành viên thành công
 *       401:
 *         description: Unauthorized
 */
router.get("/groups/:roomId/member", getMember);

/**
 * @swagger
 * /api/chat/groups/{roomId}/member:
 *   post:
 *     summary: Thêm thành viên vào nhóm chat (owner/co_owner)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usersId:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách userId cần thêm
 *     responses:
 *       200:
 *         description: Thêm thành viên thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Không đủ quyền
 *       404:
 *         description: Không tìm thấy phòng hoặc user
 */
router.post("/groups/:roomId/member", addMemberToGroup);

/**
 * @swagger
 * /api/chat/{roomId}/seen:
 *   patch:
 *     summary: Đánh dấu đã đọc tất cả tin nhắn trong phòng chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Đã đọc tin nhắn thành công
 *       401:
 *         description: Unauthorized
 */
router.patch("/:roomId/seen", seenMessage);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages/image:
 *   post:
 *     summary: Gửi ảnh vào phòng chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Gửi ảnh thành công
 *       400:
 *         description: Không có ảnh nào được gửi
 *       401:
 *         description: Unauthorized
 */
router.post("/rooms/:roomId/messages/image", upload.array("images", 10), sendImage);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages/{messageId}:
 *   delete:
 *     summary: Xoá tin nhắn trong phòng chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       204:
 *         description: Xoá tin nhắn thành công
 *       400:
 *         description: Tin nhắn không tồn tại
 *       401:
 *         description: Unauthorized
 */
router.delete("/rooms/:roomId/messages/:messageId", deleteMessage);

/**
 * @swagger
 * /api/chat/groups/{roomId}/member/{userId}/role:
 *   patch:
 *     summary: Đổi role thành viên nhóm chat (chỉ owner)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID thành viên cần đổi role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newRole:
 *                 type: string
 *                 enum: [owner, co_owner, member]
 *                 description: Role mới
 *     responses:
 *       200:
 *         description: Cập nhật role thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Không đủ quyền
 *       404:
 *         description: Không tìm thấy phòng hoặc thành viên
 */
router.patch("/groups/:roomId/member/:userId/role", changeMemberRole);

/**
 * @swagger
 * /api/chat/groups/{roomId}/member/{userId}:
 *   delete:
 *     summary: Xoá thành viên khỏi nhóm chat (chỉ owner)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID thành viên cần xoá
 *     responses:
 *       200:
 *         description: Đã xoá thành viên khỏi nhóm
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Không đủ quyền
 *       404:
 *         description: Không tìm thấy phòng hoặc thành viên
 */
router.delete("/groups/:roomId/member/:userId", removeMember);

/**
 * @swagger
 * /api/chat/groups/{roomId}/leave:
 *   delete:
 *     summary: Rời khỏi nhóm chat (user tự rời)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Đã rời khỏi nhóm
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc chủ nhóm không thể rời
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Không thuộc nhóm
 *       404:
 *         description: Không tìm thấy phòng
 */
router.delete("/groups/:roomId/leave", leaveGroup);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/delete:
 *   delete:
 *     summary: Xoá phòng chat của user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Xoá phòng chat thành công
 *       400:
 *         description: Phòng chat không tồn tại
 *       401:
 *         description: Unauthorized
 */
router.delete("/rooms/:roomId/delete", deleteRoomChatForUser);



router.patch("/room/:roomId/title", changeRoomTitle);

router.patch("/room/:roomId/avatar", upload.single("avatar"), changeRoomAvatar);
export default router;