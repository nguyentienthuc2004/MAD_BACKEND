import express from "express";
import { getRoomChat, postRoomChat, getMessage, sendMessage, deleteMessage, editNickname, createGroup, seenMessage, editRoom, getMember, sendImage } from "../controllers/chat.controller.js";
import upload from "../middleware/upload.middleware.js";
const router = express.Router();
router.get("/rooms", getRoomChat);
router.post("/rooms", postRoomChat);
router.get("/rooms/:roomId/messages", getMessage)
router.post("/rooms/:roomId/messages", sendMessage)
router.patch("/rooms/:roomId/users/:userId/nickname", editNickname)
router.post("/groups", createGroup);
router.patch("/rooms/:roomId", editRoom);
router.get("/groups/:roomId/member", getMember);
router.patch("/:roomId/seen", seenMessage);
router.post("/rooms/:roomId/messages/image", upload.array("images", 10), sendImage);
router.delete("/rooms/:roomId/messages/:messageId", deleteMessage);
export default router;