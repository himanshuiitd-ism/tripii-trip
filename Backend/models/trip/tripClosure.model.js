import mongoose, { Schema } from "mongoose";

/**
 * TripClosure
 * -------------------------
 * Stores DERIVED + STORY-READY data
 * Generated once when trip ends
 * Used for:
 * - Trip summary screen
 * - Shareable clip
 * - Future Sunday intelligence (later)
 */

const tripClosureSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      unique: true,
      index: true,
    },

    closedAt: {
      type: Date,
      default: Date.now,
    },

    /* ---------------- CORE METRICS ---------------- */
    summary: {
      core: {
        totalSpent: { type: Number, default: 0 },
        perPersonSpent: { type: Number, default: 0 },
        durationDays: { type: Number, default: 0 },
      },

      counts: {
        totalPhotos: { type: Number, default: 0 },
        totalPlans: { type: Number, default: 0 },
        totalExpenses: { type: Number, default: 0 },
      },

      /* ---------------- HIGHLIGHTS ---------------- */
      highlights: {
        /* TOP 10 PHOTOS (by engagement) */
        topPhotos: [
          {
            photo: {
              type: Schema.Types.ObjectId,
              ref: "TripPhoto",
              required: true,
            },
            likes: { type: Number, default: 0 },
            _id: false,
          },
        ],

        /* MOST LOVED PLACE */
        mostLovedPlace: {
          name: String,
          coordinates: {
            lat: Number,
            lng: Number,
          },
          loveScore: Number,
          reason: String,
        },

        /* HIGHEST SPEND PLACE */
        highestSpendPlace: {
          name: String,
          amount: Number,
          category: String,
        },
      },
    },

    /* ---------------- JOURNEY TIMELINE ---------------- */
    timeline: [
      {
        type: {
          type: String,
          enum: ["plan", "expense", "photo", "checklist"],
          required: true,
        },

        timestamp: { type: Date, required: true },

        location: {
          name: String,
          coordinates: {
            lat: Number,
            lng: Number,
          },
        },

        meta: {
          title: String, // plan title / checklist item
          amount: Number, // expense
          photo: {
            type: Schema.Types.ObjectId,
            ref: "TripPhoto",
          },
        },

        _id: false,
      },
    ],

    /* ---------------- CLIP GENERATION ---------------- */
    clip: {
      generated: { type: Boolean, default: false },
      url: String,
      generatedAt: Date,
    },

    /* ---------------- CONTROL ---------------- */
    regeneratedAt: Date,
  },
  { timestamps: true }
);

export const TripClosure = mongoose.model("TripClosure", tripClosureSchema);
