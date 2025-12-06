import mongoose, { Schema } from "mongoose";

const roomSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    parentCommunity: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    roombackgroundImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    // members (quick participant list) — keep as User refs (small)
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["owner", "moderator", "member"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],

    roomtype: {
      type: String,
      enum: ["Normal", "Trip"],
    },

    // If room is connected to a trip
    linkedTrip: { type: Schema.Types.ObjectId, ref: "Trip", default: null },

    // isPrivate: { type: Boolean, default: false },

    // ephemeral room support
    isEphemeral: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date }, // after this server should delete messages / room if autoDelete true
    autoDeleteAfterEnd: { type: Boolean, default: true },

    messages: [{ type: Schema.Types.ObjectId, ref: "MessageInRoom" }],
    pinnedMessage: { type: Schema.Types.ObjectId, ref: "MessageInRoom" },

    tags: [{ type: String }],
    status: {
      type: String,
      enum: ["upcoming", "active", "finished", "cancelled"],
      default: "upcoming",
    },

    externalLink: { label: String, url: String },
  },
  { timestamps: true }
);

roomSchema.index({ parentCommunity: 1, createdAt: -1 });

export const Room = mongoose.model("Room", roomSchema);
