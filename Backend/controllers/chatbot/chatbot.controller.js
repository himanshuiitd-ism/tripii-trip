import asyncHandler from "../../utils/asyncHandler.js";
import { GoogleGenAI } from "@google/genai";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { AiChat } from "../../models/user/AiChat.model.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// intent detector
function detectMode(prompt = "") {
  const p = prompt.toLowerCase();

  const explainKeywords = [
    "explain",
    "why",
    "how",
    "detail",
    "breakdown",
    "more about",
    "budget of",
    "cost of",
  ];

  for (const k of explainKeywords) {
    if (p.includes(k)) return "CHAT";
  }

  return "PLAN";
}

/* =========================================================
   SYSTEM PROMPT (Two types according to intent (plan generate or plan discussion)
========================================================= */
const PLAN_SYSTEM_PROMPT = `
You are Sunday, an AI travel planner inside the TripiiTrip app.

CRITICAL OUTPUT RULES (MANDATORY):
- Output STRICT JSON only.
- Do NOT include markdown, explanations, emojis, or extra text.
- Do NOT wrap JSON in backticks.
- If you cannot follow the schema exactly, return {}.
- Every response must be directly usable by the app.

JSON SCHEMA (MUST MATCH EXACTLY):
{
  "days": [
    {
      "day": 1,
      "title": "",
      "points": ["", "", ""]
    }
  ],
  "budget": {
    "transport": "LOW|MEDIUM|HIGH",
    "accommodation": "LOW|MEDIUM|HIGH",
    "local": "LOW|MEDIUM|HIGH"
  }
}

CONTENT RULES:
- Concise bullet points only.
- Logical travel order.
- No repetition.
`;

const CHAT_SYSTEM_PROMPT = `
You are Sunday, a helpful travel assistant.

The user ALREADY has a travel plan.
Your job is to EXPLAIN or CLARIFY parts of that plan.

RULES:
- Do NOT generate a full itinerary.
- Do NOT repeat the entire plan.
- Respond in bullet points or short paragraphs.
- Be concise and contextual.
- Do NOT output JSON.
`;

/* =========================================================
   POST: Get AI Response
========================================================= */
export const getChatbotResponse = asyncHandler(async (req, res) => {
  const { prompt } = req.body;
  const userId = req.user._id;

  if (!prompt) throw new ApiError(400, "Prompt is required");

  const mode = detectMode(prompt);

  // Fetch last messages from AiChat model
  const historyDocs = await AiChat.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const history = historyDocs.reverse().map((m) => ({
    role: m.sender === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  const systemPrompt =
    mode === "PLAN" ? PLAN_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT;

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    ...history,
    { role: "user", parts: [{ text: prompt }] },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
  });

  let reply = "";
  const candidate = response?.candidates?.[0];

  if (candidate?.content?.parts) {
    reply = candidate.content.parts.map((p) => p.text).join("\n");
  }

  if (!reply) reply = mode === "PLAN" ? "{}" : "I couldn't clarify that.";

  const baseId = Date.now();

  await AiChat.insertMany([
    {
      user: userId,
      messageId: baseId,
      sender: "user",
      text: prompt,
    },
    {
      user: userId,
      messageId: baseId + 1,
      sender: "model",
      text: reply,
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        messageId: baseId + 1,
        sender: "model",
        text: reply,
      },
      "Sunday responded"
    )
  );
});

/* =========================================================
   PATCH: Edit AI Message (USER-SIDE EDIT ONLY)
========================================================= */
export const updateAIMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;

  const updated = await AiChat.findOneAndUpdate(
    {
      user: req.user._id,
      messageId,
      sender: "model",
    },
    { text },
    { new: true }
  );

  if (!updated) throw new ApiError(404, "Message not found");

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "AI message updated"));
});

/* =========================================================
   GET: Chat History
========================================================= */
export const getChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const chats = await AiChat.find({ user: userId })
    .sort({ createdAt: 1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, chats, "Chat history retrieved successfully"));
});
