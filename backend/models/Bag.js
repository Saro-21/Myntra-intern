const mongoose = require("mongoose");

/**
 * Concurrency approach: OPTIMISTIC LOCKING via Mongoose's built-in __v versionKey.
 *
 * Why optimistic locking over MongoDB multi-document transactions?
 * - Cart items are single-document updates (quantity, savedForLater).
 * - Optimistic locking is lower latency — no distributed lock overhead.
 * - MongoDB transactions require a replica set; optimistic locking works on
 *   standalone instances and Atlas free tiers alike.
 * - On conflict (VersionError), the client retries with a fresh read — correct
 *   for quantity updates where "last writer wins" is wrong but "detected and
 *   retried" is right.
 *
 * Pattern:
 *   1. Client reads item → receives { _id, __v, quantity, ... }
 *   2. Client PATCHes with { itemId, expectedVersion: __v, newQuantity }
 *   3. Server calls findOneAndUpdate({ _id, __v: expectedVersion }, update)
 *   4. If no document matched → concurrent write detected → 409 Conflict returned
 *   5. Client re-fetches and retries
 */
const BagItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    size: {
      type: String,
      default: "M",
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Snapshot of the price when this item was added — used to detect price changes at checkout
    priceAtAdd: {
      type: Number,
      default: null,
    },
    // Separates active cart items from saved-for-later items
    // Only items with savedForLater: false count toward totals
    savedForLater: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Soft-delete flag for discontinued products (rather than hard removal)
    isDiscontinued: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    // Mongoose uses __v as optimistic lock version key by default
    // It is automatically incremented on each save() call
    versionKey: "__v",
  }
);

// Compound index for efficient per-user cart queries (used in every cart fetch)
BagItemSchema.index({ userId: 1, savedForLater: 1 });
// Unique constraint: one entry per user+product+size combination (prevents duplicate cart rows)
BagItemSchema.index({ userId: 1, productId: 1, size: 1 }, { unique: true });

module.exports = mongoose.model("Bag", BagItemSchema);

