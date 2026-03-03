import { createPost } from "../controllers/post.controller.js";
import express from "express";
import upload from "../middleware/upload.middleware.js";
const router = express.Router();

/**
 * @swagger
 * /api/posts/create:
 *   post:
 *     summary: Create a new post with images
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PostCreateRequest'
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreatePostResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/create", upload.array("images", 10), createPost);
export default router;