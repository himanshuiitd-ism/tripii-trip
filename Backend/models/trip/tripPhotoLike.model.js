import mongoose, { Schema } from "mongoose";

const photoLikeSchema = new Schema(
  {
    photo: {
      type: Schema.Types.ObjectId,
      ref: "TripPhoto",
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// 🚫 Prevent double-like
photoLikeSchema.index({ photo: 1, user: 1 }, { unique: true });

export const PhotoLike = mongoose.model("PhotoLike", photoLikeSchema);
