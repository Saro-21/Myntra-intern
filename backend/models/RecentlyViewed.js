const mongoose = require("mongoose");

const RecentlyViewedSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique compound index so we can update existing view records easily and prevent duplicates
RecentlyViewedSchema.index({ userId: 1, productId: 1 }, { unique: true });
// TTL Index: Automatically expire browsing history records after 30 days
RecentlyViewedSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model("RecentlyViewed", RecentlyViewedSchema);

