import asyncHandler from "../../utils/asyncHandler.js";
import { GoogleGenAI } from "@google/genai";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user/user.model.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_PROMPT = `
You are Sunday, an intelligent travel assistant inside the TripiiTrip app.

RULES (MANDATORY):
1. Always respond in clear bullet points.
2. Always give a step-by-step travel plan.
3. Always provide a budget estimate table at the end.
4. Budget table MUST include:
   - Transport / Flights
   - Accommodation
   - Local Expenses
5. If exact prices are unknown, give LOW / MEDIUM / HIGH ranges.
6. Be concise, practical, and structured.
7. Remember previous conversation context and continue naturally.
`;

export const getChatbotResponse = asyncHandler(async (req, res) => {
  const { prompt } = req.body;
  const userId = req.user?._id;

  if (!prompt) {
    throw new ApiError(400, "Prompt is required");
  }

  const user = await User.findById(userId).select("aiChatHistory");

  const history = (user?.aiChatHistory || []).slice(-10).map((m) => ({
    role: m.sender === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  const contents = [
    {
      role: "user",
      parts: [{ text: `SYSTEM INSTRUCTIONS:\n${SYSTEM_PROMPT}` }],
    },
    ...history,
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      // ❗ REMOVE googleSearch for now
    });

    // ✅ SAFE TEXT EXTRACTION
    let reply = "";
    const candidate = response?.candidates?.[0];

    if (candidate?.content?.parts) {
      reply = candidate.content.parts
        .map((p) => p.text)
        .filter(Boolean)
        .join("\n");
    }

    if (!reply) {
      return res
        .status(200)
        .json(new ApiResponse(200, null, "No AI response generated"));
    }

    // ✅ SAVE WITH CORRECT ROLES
    await User.findByIdAndUpdate(userId, {
      $push: {
        aiChatHistory: {
          $each: [
            { id: Date.now(), text: prompt, sender: "user" },
            { id: Date.now() + 1, text: reply, sender: "model" },
          ],
          $slice: -50,
        },
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, reply, "Sunday responded successfully"));
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new ApiError(500, "Failed to get response from Sunday AI");
  }
});

export const saveChatHistory = asyncHandler(async (req, res) => {
  //post
  const { id, text, sender } = req.body;
  const userId = req.user._id;
  if (!id || !text || !sender) {
    throw new ApiError(500, "All fields are required");
  } else {
    try {
      await User.findByIdAndUpdate(
        userId,
        { $push: { aiChatHistory: { id, text, sender } } },
        { new: true }
      );
      const apiResponse = new ApiResponse(
        200,
        null,
        "Chat history saved successfully"
      );
      return res.status(200).json(apiResponse);
    } catch (error) {
      console.error("Error in saving:", error);
      throw new ApiError(500, "Failed to save chat history");
    }
  }
});

export const getChatHistory = asyncHandler(async (req, res) => {
  //get

  const userId = req.user?._id;

  if (!userId) {
    console.error("Unauthorized access attempt to get chat history");
    throw new ApiError(401, "Unauthorized access");
  }
  try {
    const user = await User.findById(userId);
    const chatHistory = user.aiChatHistory || [];
    const apiResponse = new ApiResponse(
      200,
      chatHistory,
      "Chat history retrieved successfully"
    );
    return res.status(200).json(apiResponse);
  } catch (error) {
    console.error("Error in retrieving the chats:", error);
    throw new ApiError(500, "Failed to retrieve chat history");
  }
});
