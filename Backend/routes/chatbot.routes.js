// src/routes/chatbot.routes.js
import { Router } from "express";
import {
  getChatbotResponse,
  getChatHistory,
  updateAIMessage,
} from "../controllers/chatbot/chatbot.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", verifyJWT, getChatbotResponse); // send prompt
router.get("/history", verifyJWT, getChatHistory); // load chat
router.patch("/:messageId", verifyJWT, updateAIMessage); // edit AI msg

export default router;
