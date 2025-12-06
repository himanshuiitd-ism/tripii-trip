import mongoose, { Schema } from "mongoose";

const tripPlanSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    date: { type: Date, required: true },

    time: {
      start: String,
      end: String,
    },

    location: {
      name: String,
      address: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    // Who added this plan
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Source of creation
    addedBy: {
      type: String,
      enum: ["user", "sunday_ai"],
      default: "user",
    },

    // Minimal AI info
    aiMetadata: {
      reason: String,
      confidence: Number,
    },
  },
  { timestamps: true }
);

export const TripPlan = mongoose.model("TripPlan", tripPlanSchema);
