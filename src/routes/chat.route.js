import express from "express";
import { getRoomChat, postRoomChat, getMessage, sendMessage, editNickname, createGroup, seenMessage, editRoom, getMember } from "../controllers/chat.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
const router = express.Router();
router.get("/rooms", authenticate, getRoomChat);
router.post("/rooms", authenticate, postRoomChat);
router.get("/rooms/:roomId/messages", authenticate, getMessage)
router.post("/rooms/:roomId/messages", authenticate, sendMessage)
router.patch("/rooms/:roomId/users/:userId/nickname", authenticate, editNickname)
router.post("/groups", authenticate, createGroup);
router.patch("/rooms/:roomId", authenticate, editRoom);
router.get("/groups/:roomId/member", authenticate, getMember);
router.patch("/:roomId/seen", authenticate, seenMessage);
export default router;