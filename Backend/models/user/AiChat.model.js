// src/models/chat/AiChat.model.js
import mongoose, { Schema } from "mongoose";

const aiChatSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    messageId: {
      type: Number,
      required: true,
      index: true, // used for edit
    },

    sender: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },

    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt is IMPORTANT for ordering
  }
);

// Prevent duplicate message IDs per user
aiChatSchema.index({ user: 1, messageId: 1 }, { unique: true });
aiChatSchema.index({ user: 1, createdAt: 1 });

export const AiChat = mongoose.model("AiChat", aiChatSchema);
