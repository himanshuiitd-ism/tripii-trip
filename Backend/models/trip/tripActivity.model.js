import mongoose, { Schema } from "mongoose";

const tripActivitySchema = new Schema(
  {
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    type: {
      type: String,
      enum: [
        "trip_created",
        "plan_added",
        "plan_updated",
        "checklist_added",
        "checklist_completed",
        "expense_added",
        "photo_uploaded",
      ],
    },

    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },

    targetId: { type: Schema.Types.ObjectId },
    targetModel: String,

    description: String,
  },
  { timestamps: true }
);

export const TripActivity = mongoose.model("TripActivity", tripActivitySchema);
