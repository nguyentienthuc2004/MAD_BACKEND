import express from "express";
import { getRoomChat, postRoomChat } from "../controllers/chat.controller.js";

const router = express.Router();
router.get("/rooms", getRoomChat);
router.post("/rooms", postRoomChat);

export default router;