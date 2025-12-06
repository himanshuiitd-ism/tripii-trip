import mongoose, { Schema } from "mongoose";

const tripChecklistSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },

    // The item user needs to remember
    item: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    // Optional description
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    // Who added this item
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Visibility: public = every member, private = only creator
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    // Whether user has completed the item
    isCompleted: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
    },

    completedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Sunday AI generated?
    addedBy: {
      type: String,
      enum: ["user", "sunday_ai"],
      default: "user",
    },

    // Minimal AI metadata – enough to train Sunday
    aiMetadata: {
      reason: { type: String, trim: true }, // e.g. "international travel: passport required"
      confidence: { type: Number, min: 0, max: 1 },
    },

    // Auto-generated checklists must be sorted BELOW user checklists
    sortWeight: {
      type: Number,
      default: 0, // user-added = 0 (top), AI-generated = 1 (bottom)
    },
  },
  { timestamps: true }
);

export const TripChecklist = mongoose.model(
  "TripChecklist",
  tripChecklistSchema
);
