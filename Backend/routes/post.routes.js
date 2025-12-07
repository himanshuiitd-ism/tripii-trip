import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  createNormalPost,
  createTripPost,
  deletePost,
  getFeedPosts,
  getPostById,
  toggleBookmark,
  toggleLike,
} from "../controllers/user/post.controller.js";
const router = express.Router();
router.use(verifyJWT);

router.route("/createPost").post(createNormalPost);
router.route("/createTripPost").post(createTripPost);
router.route("/like/:postId").post(toggleLike);
router.route("/comment/:postId").post(addComment);
router.route("/deletePost/:postId").delete(deletePost);
router.route("/getPosts").get(getFeedPosts);
router.route("/getPost/:postId").get(getPostById);
router.route("/bookMark/:postId").post(toggleBookmark);

export default router;
