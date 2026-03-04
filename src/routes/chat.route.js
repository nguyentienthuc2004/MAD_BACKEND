import express from "express";
import { getRoomChat, postRoomChat, getMessage, sendMessage } from "../controllers/chat.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
const router = express.Router();
router.get("/rooms", authenticate, getRoomChat);
router.post("/rooms", authenticate, postRoomChat);
router.get("/rooms/:roomId/messages", authenticate, getMessage)
router.post("/rooms/:roomId/messages", authenticate, sendMessage)
export default router;