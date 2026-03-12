import express from "express";
import { getAllMusics } from "../controllers/music.controller.js";

const router = express.Router();

router.get("/",getAllMusics);
export default router;