const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "cod"],
      default: "cod",
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple pending transactions with null key before webhook callback
    },
    receiptUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// MongoDB Indexing Strategy for efficient queries (filtering & sorting & cursor pagination)
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, status: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, paymentMethod: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", TransactionSchema);
