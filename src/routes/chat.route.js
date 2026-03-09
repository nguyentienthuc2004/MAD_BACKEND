import express from "express";
import { getRoomChat, postRoomChat, getMessage, sendMessage, editNickname, createGroup } from "../controllers/chat.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
const router = express.Router();
router.get("/rooms", authenticate, getRoomChat);
router.post("/rooms", authenticate, postRoomChat);
router.get("/rooms/:roomId/messages", authenticate, getMessage)
router.post("/rooms/:roomId/messages", authenticate, sendMessage)
router.patch("/rooms/:roomId/users/nicknames", authenticate, editNickname)
router.post("/groups", authenticate, createGroup);
export default router;