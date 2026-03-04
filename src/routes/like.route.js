import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  likePost,
  likeComment,
  checkLikeStatus,
  getPostLikes,
} from "../controllers/like.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Likes
 *   description: Like management endpoints
 */

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   post:
 *     summary: Toggle like on a post
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     liked:
 *                       type: boolean
 *                     likeCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.post("/posts/:postId/like", authenticate, likePost);

/**
 * @swagger
 * /api/comments/{commentId}/like:
 *   post:
 *     summary: Toggle like on a comment
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     liked:
 *                       type: boolean
 *                     likeCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.post("/comments/:commentId/like", authenticate, likeComment);

/**
 * @swagger
 * /api/likes/{targetType}/{targetId}/status:
 *   get:
 *     summary: Check if current user has liked a target
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [post, comment]
 *         description: Type of target (post or comment)
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *         description: Target ID
 *     responses:
 *       200:
 *         description: Like status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     liked:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid target type or ID
 */
router.get("/likes/:targetType/:targetId/status", authenticate, checkLikeStatus);

/**
 * @swagger
 * /api/posts/{postId}/likes:
 *   get:
 *     summary: Get list of users who liked a post
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: List of users who liked the post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     likes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           avatar:
 *                             type: string
 *       400:
 *         description: Invalid post ID
 */
router.get("/posts/:postId/likes", getPostLikes);

export default router;
