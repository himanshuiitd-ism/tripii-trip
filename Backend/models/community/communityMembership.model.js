import mongoose, { Schema } from "mongoose";

const communityMembershipSchema = new Schema(
  {
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    role: { type: String, enum: ["admin", "member"], default: "member" },

    displayName: String,
    displayProfile: String,
  },
  { timestamps: true }
);

communityMembershipSchema.index({ community: 1, user: 1 }, { unique: true });

export const CommunityMembership = mongoose.model(
  "CommunityMembership",
  communityMembershipSchema
);
