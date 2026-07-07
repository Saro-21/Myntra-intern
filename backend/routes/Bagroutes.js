const express = require("express");
const router = express.Router();
const Bag = require("../models/Bag");
const Product = require("../models/Product");

/**
 * CONCURRENCY STRATEGY: OPTIMISTIC LOCKING
 *
 * - Every BagItem document carries a Mongoose __v version counter.
 * - When a client wants to update quantity or savedForLater status, it must send
 *   the `expectedVersion` (__v) it last read alongside the update payload.
 * - The server uses findOneAndUpdate({ _id, __v: expectedVersion }, ...) which
 *   atomically matches ONLY if the version hasn't changed since the read.
 * - If another device/session wrote between the client's read and its write,
 *   the version will have incremented and the query returns null → 409 Conflict.
 * - Mongoose automatically increments __v on each successful save/update.
 *
 * WHY NOT MongoDB multi-document ACID transactions?
 * - Cart item updates are single-document operations — ACID transactions are only
 *   needed for multi-document atomicity (e.g., order + inventory together).
 * - Optimistic locking is lower-overhead: no session handles, no lock contention.
 * - Works on Atlas Serverless and standalone MongoDB, no replica set required.
 * - Correct semantics: "detect and retry" vs "block and wait".
 */

// ── 1. ADD TO CART ─────────────────────────────────────────────────────────
// POST /bag
// Upserts by userId+productId+size; snapshots current product price as priceAtAdd
router.post("/", async (req, res) => {
  const { userId, productId, size, quantity, savedForLater } = req.body;
  if (!userId || !productId) {
    return res.status(400).json({ message: "userId and productId are required" });
  }
  try {
    // Fetch current price to snapshot
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!product.inStock || product.stock < 1) {
      return res.status(409).json({ message: "Product is out of stock" });
    }

    // Upsert: if the user already has this product+size, increment quantity
    const isSaveLater = savedForLater === true;
    const existing = await Bag.findOne({ userId, productId, size: size || "M", savedForLater: isSaveLater });
    if (existing) {
      if (isSaveLater) {
        return res.status(200).json(existing);
      }
      const updated = await Bag.findOneAndUpdate(
        { _id: existing._id, __v: existing.__v }, // Optimistic lock check
        { $inc: { quantity: quantity || 1 } },
        { new: true }
      );
      if (!updated) {
        return res.status(409).json({ message: "Concurrent update detected. Please refresh and retry." });
      }
      return res.status(200).json(updated);
    }

    const newItem = await Bag.create({
      userId,
      productId,
      size: size || "M",
      quantity: quantity || 1,
      priceAtAdd: product.price,
      savedForLater: isSaveLater,
    });
    return res.status(200).json(newItem);
  } catch (error) {
    // Handle unique index collision from two simultaneous adds
    if (error.code === 11000) {
      return res.status(409).json({ message: "Item already in cart. Please refresh and retry." });
    }
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

// ── 2. GET CART ────────────────────────────────────────────────────────────
// GET /bag?userId=xxx
// Returns active + saved-for-later items separately; computes active total
router.get("/", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ message: "userId query parameter is required" });
  }
  try {
    const allItems = await Bag.find({ userId }).populate("productId");

    const activeItems = allItems.filter(i => !i.savedForLater && !i.isDiscontinued);
    const savedItems  = allItems.filter(i => i.savedForLater);
    const discontinued = allItems.filter(i => i.isDiscontinued);

    const total = activeItems.reduce((sum, i) => {
      const price = i.productId?.price || i.priceAtAdd || 0;
      return sum + price * (i.quantity || 1);
    }, 0);

    return res.status(200).json({ activeItems, savedItems, discontinued, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

// ── 3. CONCURRENCY-SAFE QUANTITY UPDATE ────────────────────────────────────
// PATCH /bag?action=update-quantity
// Requires expectedVersion (__v) to prevent simultaneous overwrites
router.patch("/", async (req, res) => {
  const { action } = req.query;

  if (action === "update-quantity") {
    const { itemId, quantity, expectedVersion } = req.body;
    if (!itemId || quantity == null || expectedVersion == null) {
      return res.status(400).json({ message: "itemId, quantity, and expectedVersion are required" });
    }
    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }
    try {
      // Atomic conditional update: only proceeds if __v matches the client's last-seen version
      const updated = await Bag.findOneAndUpdate(
        { _id: itemId, __v: expectedVersion },   // Version guard
        { $set: { quantity }, $inc: { __v: 1 } }, // Increment version on success
        { new: true }
      );
      if (!updated) {
        // Either item not found OR version mismatch (concurrent write detected)
        const current = await Bag.findById(itemId);
        if (!current) return res.status(404).json({ message: "Cart item not found" });
        return res.status(409).json({
          message: "Conflict: this item was updated by another session. Please refresh.",
          currentVersion: current.__v,
          currentQuantity: current.quantity,
        });
      }
      return res.status(200).json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }

  // ── SAVE FOR LATER ──────────────────────────────────────────────────────
  if (action === "save-for-later") {
    const { itemId, expectedVersion } = req.body;
    if (!itemId || expectedVersion == null) {
      return res.status(400).json({ message: "itemId and expectedVersion are required" });
    }
    try {
      const updated = await Bag.findOneAndUpdate(
        { _id: itemId, __v: expectedVersion },
        { $set: { savedForLater: true }, $inc: { __v: 1 } },
        { new: true }
      );
      if (!updated) {
        const current = await Bag.findById(itemId);
        if (!current) return res.status(404).json({ message: "Cart item not found" });
        return res.status(409).json({
          message: "Conflict: this item was updated by another session. Please refresh.",
          currentVersion: current.__v,
        });
      }
      return res.status(200).json({ message: "Item saved for later", item: updated });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }

  // ── MOVE BACK TO CART ───────────────────────────────────────────────────
  if (action === "move-to-cart") {
    const { itemId, expectedVersion } = req.body;
    if (!itemId || expectedVersion == null) {
      return res.status(400).json({ message: "itemId and expectedVersion are required" });
    }
    try {
      const updated = await Bag.findOneAndUpdate(
        { _id: itemId, __v: expectedVersion },
        { $set: { savedForLater: false }, $inc: { __v: 1 } },
        { new: true }
      );
      if (!updated) {
        const current = await Bag.findById(itemId);
        if (!current) return res.status(404).json({ message: "Cart item not found" });
        return res.status(409).json({
          message: "Conflict: this item was updated by another session. Please refresh.",
          currentVersion: current.__v,
        });
      }
      return res.status(200).json({ message: "Item moved back to cart", item: updated });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }

  return res.status(400).json({ message: "Invalid action" });
});

// ── 4. CHECKOUT VALIDATION ─────────────────────────────────────────────────
// POST /bag?action=validate-checkout&userId=xxx
// Runs pre-checkout checks: stock, price drift, discontinued items
// Returns a detailed report — never fails silently
router.post("/", async (req, res) => {
  // Forward to add-to-cart if no action param
});

router.get("/validate-checkout", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }
  try {
    const activeItems = await Bag.find({ userId, savedForLater: false }).populate("productId");
    const report = {
      valid: true,
      warnings: [],      // Price changes or low stock — checkout can proceed
      errors: [],        // Out-of-stock items — must be resolved
      discontinuedIds: [],
      total: 0,
    };

    for (const item of activeItems) {
      const product = item.productId;

      // 1. Discontinued / deleted product
      if (!product) {
        await Bag.findByIdAndUpdate(item._id, { $set: { isDiscontinued: true } });
        report.discontinuedIds.push(item._id);
        report.warnings.push({
          itemId: item._id,
          type: "DISCONTINUED",
          message: "A product in your cart is no longer available and has been flagged.",
        });
        continue;
      }

      // 2. Out of stock check
      if (!product.inStock || product.stock < item.quantity) {
        report.valid = false;
        report.errors.push({
          itemId: item._id,
          productId: product._id,
          productName: product.name,
          type: "OUT_OF_STOCK",
          availableStock: product.stock,
          requestedQuantity: item.quantity,
          message: `"${product.name}" has only ${product.stock} unit(s) in stock (you need ${item.quantity}).`,
        });
        continue;
      }

      // 3. Price change detection
      if (item.priceAtAdd !== null && item.priceAtAdd !== product.price) {
        const direction = product.price > item.priceAtAdd ? "increased" : "decreased";
        report.warnings.push({
          itemId: item._id,
          productId: product._id,
          productName: product.name,
          type: "PRICE_CHANGED",
          priceAtAdd: item.priceAtAdd,
          currentPrice: product.price,
          message: `"${product.name}" price has ${direction} from ₹${item.priceAtAdd} to ₹${product.price}.`,
        });
        // Update the snapshot to current price so the user always pays current price
        await Bag.findByIdAndUpdate(item._id, { $set: { priceAtAdd: product.price } });
      }

      // Accumulate total with current prices
      report.total += product.price * item.quantity;
    }

    return res.status(200).json(report);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Checkout validation failed" });
  }
});

// ── 5. DELETE ITEM ─────────────────────────────────────────────────────────
router.delete("/", async (req, res) => {
  const { itemId } = req.query;
  if (!itemId) {
    return res.status(400).json({ message: "itemId query parameter is required" });
  }
  try {
    await Bag.findByIdAndDelete(itemId);
    return res.status(200).json({ message: "Item removed from bag" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error removing item from bag" });
  }
});

// Legacy path-param routes (backwards compat)
router.get("/:userid", async (req, res) => {
  try {
    const bag = await Bag.find({ userId: req.params.userid }).populate("productId");
    res.status(200).json(bag);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/:itemid", async (req, res) => {
  try {
    await Bag.findByIdAndDelete(req.params.itemid);
    res.status(200).json({ message: "Item removed from bag" });
  } catch (error) {
    res.status(500).json({ message: "Error removing item from bag" });
  }
});

module.exports = router;
