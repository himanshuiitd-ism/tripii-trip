import mongoose from "mongoose";

const spamTrackerSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  modelId: mongoose.Schema.Types.ObjectId,
  count: { type: Number, default: 0 },
});

export const SpamTracker = mongoose.model("SpamTracker", spamTrackerSchema);
