import mongoose, { Schema } from "mongoose";

const tripWalletSchema = new Schema({
  trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },

  manager: { type: Schema.Types.ObjectId, ref: "User", required: true },

  expenses: [{ type: Schema.Types.ObjectId, ref: "Expense" }],

  totalSpend: { type: Number, default: 0 },

  budget: { type: Number, default: 0 },

  settings: {
    expensePermission: {
      type: String,
      enum: ["all", "accountant_only"],
      default: "all",
    },
  },
});

tripWalletSchema.index({ trip: 1 });

export const TripWallet = mongoose.model("TripWallet", tripWalletSchema);
