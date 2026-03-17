import express from "express";
import {
  followUser,
  unfollowUser,
} from "../controllers/follow.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateObjectId } from "../middleware/validate.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Follow
 *   description: Follow/Unfollow operations
 */

/**
 * @swagger
 * /api/follow/{userId}:
 *   post:
 *     summary: Follow a user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to follow
 *     responses:
 *       201:
 *         description: User followed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User followed successfully
 *       400:
 *         description: Bad request (self-follow or already following)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post("/:userId", authenticate, validateObjectId("userId"), followUser);

/**
 * @swagger
 * /api/follow/{userId}:
 *   delete:
 *     summary: Unfollow a user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to unfollow
 *     responses:
 *       200:
 *         description: User unfollowed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User unfollowed successfully
 *       400:
 *         description: Bad request (self-unfollow or not following)
 *       401:
 *         description: Unauthorized
 */
router.delete("/:userId", authenticate, validateObjectId("userId"), unfollowUser);

export default router;
