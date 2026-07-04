const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    action: {
      type: String,
      enum: ["created", "success", "failed", "refunded"],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    actor: {
      type: String,
      default: "system", // e.g. system, user, admin
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  { 
    timestamps: { createdAt: true, updatedAt: false } // Immutable / append-only: no updatedAt
  }
);

// Indexes for fast audit retrieval
AuditLogSchema.index({ transactionId: 1 });
AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
