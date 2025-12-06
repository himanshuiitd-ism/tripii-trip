import mongoose, { Schema } from "mongoose";

const messageInRoomSchema = new Schema(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["text", "image", "video", "gif", "document"],
      default: "text",
    },
    content: { type: String, default: "" },
    media: {
      url: String,
      publicId: String,
      mimeType: String,
      originalName: String,
    },
    seenBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        seenAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    reactions: [
      {
        emoji: String,
        by: { type: Schema.Types.ObjectId, ref: "User" },
        _id: false,
      },
    ],
    reports: [
      {
        reason: String,
        by: { type: Schema.Types.ObjectId, ref: "User" },
        _id: false,
      },
    ],

    ai: {
      sentiment: { type: Number, default: 0 },
      keywords: [{ type: String }],
      topic: { type: String, default: "" },
    },

    // optional: message auto-expiry (for ephemeral rooms or self-destruct messages)
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const MessageInRoom = mongoose.model(
  "MessageInRoom",
  messageInRoomSchema
);
