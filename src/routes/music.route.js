import express from "express";
import { getAllMusics, getMusicById } from "../controllers/music.controller.js";

const router = express.Router();

router.get("/",getAllMusics);
router.get("/:id",getMusicById);
export default router;