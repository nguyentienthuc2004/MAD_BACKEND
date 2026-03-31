
import { createPost, editPost, deletePost, getPostsByUser, getPostsNotByMe, getPostById, getPostsLikedByUser } from "../controllers/post.controller.js";
import express from "express";
import upload from "../middleware/upload.middleware.js";
const router = express.Router();


/**
 * @swagger
 * /api/posts/byUser/{userId}:
 *   get:
 *     summary: Get posts by user ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
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
 *                   example: Posts retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error
 */
router.get("/byUser/:userId", getPostsByUser);
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

/**
 * @swagger
 * /api/posts/edit/{postId}:
 *   put:
 *     summary: Edit a post (keep old image URLs and add new image files)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PostEditRequest'
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreatePostResponse'
 *       400:
 *         description: Invalid data (e.g. invalid existingImages or too many images)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.put("/edit/:postId", upload.array("images", 10), editPost);

/**
 * @swagger
 * /api/posts/delete/{postId}:
 *   delete:
 *     summary: Soft delete a post (set isDeleted = true)
 *     tags: [Posts]
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
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeletePostResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.delete("/delete/:postId", deletePost);

router.get("/getPostsNotByMe", getPostsNotByMe);

router.get("/:postId", getPostById);

router.post("/:postId/view", viewPost)

router.get("/likedByUser/:userId", getPostsLikedByUser);


export default router;