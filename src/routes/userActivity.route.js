import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { purgeViewActivities } from "../controllers/userActivity.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Activities
 *   description: User activity management endpoints
 */

/**
 * @swagger
 * /api/activities/views:
 *   delete:
 *     summary: Delete all view activities
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: View activities deleted
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
 *                     deletedCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete("/views",purgeViewActivities);

export default router;
