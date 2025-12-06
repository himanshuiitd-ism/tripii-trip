import mongoose, { Schema } from "mongoose";

const tripPhotoSchema = new Schema(
  {
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },

    image: {
      url: String,
      publicId: String,
    },

    caption: String,

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    location: {
      name: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        text: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    autoPosted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TripPhoto = mongoose.model("TripPhoto", tripPhotoSchema);
