import express from "express";
import { getRoomChat, postRoomChat, getMessage } from "../controllers/chat.controller.js";

const router = express.Router();
router.get("/rooms", getRoomChat);
router.post("/rooms", postRoomChat);
router.get("/rooms/:roomId/messages", getMessage)
export default router;