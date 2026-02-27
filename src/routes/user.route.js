import express from "express";
import { getUsers } from "../controllers/user.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Danh sách user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 64f1a1c2e9a1
 *                   name:
 *                     type: string
 *                     example: Nguyen Van A
 *                   email:
 *                     type: string
 *                     example: a@gmail.com
 */
router.get("/", getUsers);

export default router;
