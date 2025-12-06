import mongoose, { Schema } from "mongoose";

const tripWalletSchema = new Schema(
  {
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },

    manager: { type: Schema.Types.ObjectId, ref: "User", required: true },

    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],

    expenses: [{ type: Schema.Types.ObjectId, ref: "Expense" }],

    totalSpend: { type: Number, default: 0 },

    settings: {
      memberCanAddExpense: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const TripWallet = mongoose.model("TripWallet", tripWalletSchema);
