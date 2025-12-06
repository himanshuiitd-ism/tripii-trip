import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    // ============================
    // ⭐ Like System
    // ============================
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likeCount: { type: Number, default: 0 },

    // ============================
    // ⭐ Reply System (1–2 level)
    // ============================
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },

    rootComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },

    replyToUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    depth: {
      type: Number,
      default: 1, // 1 = top level, 2 = reply
      max: 2,
    },

    replyCount: {
      type: Number,
      default: 0,
    },

    // ============================
    // ⭐ Sunday AI data
    // ============================
    ai: {
      sentiment: { type: Number, default: 0 },
      keywords: [{ type: String }],
    },

    // ============================
    // ⭐ XP / Trust quick lookup
    // ============================
    xpAwarded: { type: Number, default: 0 },

    // ============================
    // ⭐ Moderation & delete support
    // ============================
    isDeleted: { type: Boolean, default: false },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });

export const Comment = mongoose.model("Comment", commentSchema);
