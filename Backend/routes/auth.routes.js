import express from "express";
import { googleLogin } from "../controllers/user/auth.controller.js";
import {
  register,
  login,
  logout,
} from "../controllers/user/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/google", googleLogin); // FIXED

router.post("/send-otp", (req, res) => res.send("Disabled in MVP"));
router.post("/verify-otp", (req, res) => res.send("Disabled in MVP"));

router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyJWT, logout);

export default router;
