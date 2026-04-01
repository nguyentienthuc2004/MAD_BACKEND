import express from "express";
import {
  searchUsers,
  searchPosts,
  searchPostsByHashtag,
  getTrendingHashtags,
  globalSearch,
} from "../controllers/search.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search functionality for users, posts, and hashtags
 */

/**
 * @swagger
 * /api/search/users:
 *   get:
 *     summary: Search users by username, full name, or keywords
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
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
 *         description: List of users matching the search
 *       400:
 *         description: Search query is required
 */
router.get("/users", authenticate, searchUsers);

/**
 * @swagger
 * /api/search/posts:
 *   get:
 *     summary: Search posts by caption or hashtags
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [recent, popular, trending]
 *           default: recent
 *     responses:
 *       200:
 *         description: List of posts matching the search
 *       400:
 *         description: Search query is required
 */
router.get("/posts", searchPosts);

/**
 * @swagger
 * /api/search/hashtag:
 *   get:
 *     summary: Search posts by hashtag
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: hashtag
 *         required: true
 *         schema:
 *           type: string
 *         description: Hashtag to search (with or without #)
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
 *         description: List of posts with the hashtag
 *       400:
 *         description: Hashtag is required
 */
router.get("/hashtag", searchPostsByHashtag);

/**
 * @swagger
 * /api/search/trending-hashtags:
 *   get:
 *     summary: Get trending hashtags
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of trending hashtags
 */
router.get("/trending-hashtags", getTrendingHashtags);

/**
 * @swagger
 * /api/search/global:
 *   get:
 *     summary: Global search across users, posts, and hashtags
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Combined search results
 *       400:
 *         description: Search query is required
 */
router.get("/global", authenticate, globalSearch);

export default router;
