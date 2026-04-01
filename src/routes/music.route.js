import express from "express";
import { getAllMusics, getMusicById } from "../controllers/music.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Musics
 *   description: Music catalog endpoints
 */

/**
 * @swagger
 * /api/musics:
 *   get:
 *     summary: Get all musics
 *     tags: [Musics]
 *     responses:
 *       200:
 *         description: Music list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", getAllMusics);

/**
 * @swagger
 * /api/musics/{id}:
 *   get:
 *     summary: Get music by ID
 *     tags: [Musics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Music ID
 *     responses:
 *       200:
 *         description: Music retrieved successfully
 *       404:
 *         description: Music not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", getMusicById);
export default router;