import express from "express";
import {
  getUsers,
  getUserProfile,
  getMyProfile,
  updateProfile,
  uploadAvatar,
} from "../controllers/user.controller.js";
import { getUserDetail } from "../controllers/post.controller.js";
import {
  getFollowers,
  getFollowing,
  checkFollowStatus,
} from "../controllers/follow.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateObjectId, validateUpdateProfile } from "../middleware/validate.middleware.js";
import { moderateBio } from "../middleware/moderation.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile operations
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get("/", getUsers);

/**
 * @swagger
 * /api/users/profile/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 */
router.get("/profile/me", authenticate, getMyProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile (displayName, fullName, bio)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 example: John Doe
 *               fullName:
 *                 type: string
 *                 example: John Michael Doe
 *               bio:
 *                 type: string
 *                 example: Software Developer
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put("/profile", authenticate, validateUpdateProfile, moderateBio, updateProfile);

/**
 * @swagger
 * /api/users/avatar:
 *   post:
 *     summary: Upload/change user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: No file provided
 *       401:
 *         description: Unauthorized
 */
router.post("/avatar", authenticate, upload.single("avatar"), uploadAvatar);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile
 *       404:
 *         description: User not found
 */
router.get("/:id", validateObjectId("id"), getUserProfile);

/**
 * @swagger
 * /api/users/{id}/detail:
 *   get:
 *     summary: Get user detail (posts)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User detail
 */
router.get("/:id/detail", getUserDetail);

/**
 * @swagger
 * /api/users/{id}/followers:
 *   get:
 *     summary: Get followers list
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of followers
 *       404:
 *         description: User not found
 */
router.get("/:id/followers", validateObjectId("id"), getFollowers);

/**
 * @swagger
 * /api/users/{id}/following:
 *   get:
 *     summary: Get following list
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of following
 *       404:
 *         description: User not found
 */
router.get("/:id/following", validateObjectId("id"), getFollowing);

/**
 * @swagger
 * /api/users/{id}/follow-status:
 *   get:
 *     summary: Check if following a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to check
 *     responses:
 *       200:
 *         description: Follow status
 *       401:
 *         description: Unauthorized
 */
router.get("/:id/follow-status", authenticate, validateObjectId("id"), checkFollowStatus);

export default router;
