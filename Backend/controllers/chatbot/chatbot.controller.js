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

  // 🔹 Place overview intent
  const overviewKeywords = [
    "tell me about",
    "about ",
    "overview of",
    "guide to",
    "is ",
  ];

  // If short prompt + looks like a place
  if (overviewKeywords.some((k) => p.includes(k)) && p.split(" ").length <= 6) {
    return "OVERVIEW";
  }

  // 🔹 Explanation / clarification
  const explainKeywords = [
    "explain",
    "why",
    "how",
    "detail",
    "budget of",
    "cost of",
    "elaborate",
  ];

  if (explainKeywords.some((k) => p.includes(k))) {
    return "CHAT";
  }

  // 🔹 Default: planning
  return "PLAN";
}

/* =========================================================
   HELPER: Extract JSON from markdown-wrapped response
========================================================= */
function extractJSON(text) {
  // Remove markdown code blocks
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    // Try to parse the cleaned text
    return JSON.parse(cleaned);
  } catch (e) {
    // If parsing fails, try to find JSON object in the text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        console.error("Failed to extract JSON:", e2);
        return null;
      }
    }
    console.error("No valid JSON found in response");
    return null;
  }
}

/* =========================================================
   SYSTEM PROMPT (Two types according to intent (plan generate or plan discussion)
========================================================= */
const PLAN_SYSTEM_PROMPT = `
You are Sunday, an AI travel planner inside the TripiiTrip app.
Generate an itinerary that can be directly imported as trip plans.

CRITICAL RULES:
- Output STRICT JSON only.
- No markdown, emojis, comments, or extra text.
- Follow the schema exactly or return {""} as their value.

TIME RULES:
- Every activity MUST include time.
- Use realistic ranges:
  Morning: 07:00–11:00
  Afternoon: 12:00–16:00
  Evening: 17:00–20:00
  Night: 20:00–23:00
- Schedule outdoor activities during pleasant hours.
- If timing depends on weather, explain briefly in "weatherReason".

DATE RULES:
- Use YYYY-MM-DD.
- Dates must be continuous.
- Day 1 aligns with inferred start date.

CONTENT RULES:
- 3–6 activities per day.
- Practical travel order.
- Short, actionable descriptions.
- No repetition.

JSON SCHEMA:
{
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "summary": "",
      "plans": [
        {
          "title": "",
          "description": "",
          "time": { "start": "HH:MM", "end": "HH:MM" },
          "location": { "name": "", "address": "" },
          "weatherReason": ""
        }
      ]
    }
  ],
  "budget": {
    "transport": "LOW|MEDIUM|HIGH",
    "accommodation": "LOW|MEDIUM|HIGH",
    "local": "LOW|MEDIUM|HIGH"
  }
}
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

const OVERVIEW_SYSTEM_PROMPT = `
You are Sunday, a travel assistant.

The user is asking for a COUNTRY or PLACE OVERVIEW.

RULES:
- Do NOT generate a day-wise itinerary.
- Do NOT return JSON.
- Use short paragraphs with clear category separation.
- Match the tone and length of a "budget explanation" response.
- Keep it practical and travel-focused.

CATEGORIES TO COVER (in this order):
1. What the place is famous for
2. Local food & specialties
3. Typical budget (LOW / MEDIUM / HIGH explanation)
4. Common tourist scams or things to be careful about
5. Best time or quick travel tip (optional)

FORMAT:
- Plain text
- Clear section headers
- Concise explanations
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
    .limit(3)
    .lean();

  const history = historyDocs.reverse().map((m) => ({
    role: m.sender === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  const systemPrompt =
    mode === "PLAN"
      ? PLAN_SYSTEM_PROMPT
      : mode === "CHAT"
      ? CHAT_SYSTEM_PROMPT
      : OVERVIEW_SYSTEM_PROMPT;

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

  // 🔹 CLEAN JSON FOR PLAN MODE
  let finalReply = reply;
  if (mode === "PLAN") {
    const extracted = extractJSON(reply);
    if (extracted) {
      finalReply = JSON.stringify(extracted);
    } else {
      console.warn("Failed to extract valid JSON, storing raw response");
    }
  }

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
      text: finalReply,
    },
  ]);

  console.log("Reply is:", finalReply);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        messageId: baseId + 1,
        sender: "model",
        text: finalReply,
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
