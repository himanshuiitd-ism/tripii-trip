import mongoose from "mongoose";

const pointsLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  activity: { type: String, required: true },

  xp: { type: Number, required: true },
  trust: { type: Number, required: true },

  model: { type: String, required: true }, // Post / Comment / Reel / Trip
  modelId: { type: mongoose.Schema.Types.ObjectId, required: true },

  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // liker/commenter

  createdAt: { type: Date, default: Date.now },
});

export const PointsLog = mongoose.model("PointsLog", pointsLogSchema);
