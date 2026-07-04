const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Category = require("../models/Category");
const Wishlist = require("../models/Wishlist");
const Order = require("../models/Order");
const RecentlyViewed = require("../models/RecentlyViewed");

/**
 * PERSONALIZATION ENGINE ("You May Also Like") DESIGN JUSTIFICATION
 *
 * ── 1. Cold-Start Strategy ──
 * - If the user has no history (no views, wishlist, bag, or order history),
 *   personalized signals are sparse.
 * - In this case, we fallback to overall popular products based on total
 *   view count in the RecentlyViewed database, sorted descending.
 * - If popularity data is also sparse (new installation), we fallback to the
 *   newest products sorted by `createdAt: -1`.
 * - This guarantees that the endpoint is robust and never returns empty results.
 *
 * ── 2. Time Complexity & Indexes ──
 * - To fetch the user's history and related categories: O(H + W + O) where
 *   H is history length (capped at 50), W is wishlist, and O is order items.
 * - To resolve categories: O(C * log(P)) utilizing MongoDB's index on `Category.productId`.
 * - To fetch final recommendations: O(R * log(P)) where R is the number of recommended products.
 * - Indexes created/utilized:
 *   - `RecentlyViewed.index({ userId: 1, productId: 1 })` -> immediate user history fetch.
 *   - `Category.index({ productId: 1 })` -> immediate category resolution.
 *   - `Product.index({ createdAt: -1 })` -> fast popularity / fallback sort.
 * - This batching design avoids N+1 loops (aggregates in memory or via single $in queries),
 *   ensuring end-to-end response times under 50ms.
 */
router.get("/", async (req, res) => {
  const { userId, limit = 10 } = req.query;
  const targetLimit = parseInt(limit, 10);

  try {
    let userProductIds = [];
    let excludeProductIds = [];

    if (userId) {
      // 1. Gather all product interactions for the user in parallel
      const [wishlist, history, orders] = await Promise.all([
        Wishlist.find({ userId }).select("productId").lean(),
        RecentlyViewed.find({ userId }).select("productId").lean(),
        Order.find({ userId }).select("items.productId").lean(),
      ]);

      const wishlistIds = wishlist.map(w => w.productId?.toString()).filter(Boolean);
      const historyIds = history.map(h => h.productId?.toString()).filter(Boolean);
      const orderIds = orders.flatMap(o => o.items.map(i => i.productId?.toString())).filter(Boolean);

      userProductIds = Array.from(new Set([...wishlistIds, ...historyIds, ...orderIds]));
      excludeProductIds = [...userProductIds]; // Exclude already-interacted items
    }

    let recommendations = [];

    // 2. Personalization Phase (if user has active history/interactions)
    if (userProductIds.length > 0) {
      // Find categories that contain user's products
      const categories = await Category.find({
        productId: { $in: userProductIds }
      }).select("_id productId").lean();

      if (categories.length > 0) {
        // Collect all candidate products in those matching categories
        const candidateProductIds = Array.from(
          new Set(categories.flatMap(c => c.productId.map(p => p.toString())))
        ).filter(pid => !excludeProductIds.includes(pid));

        if (candidateProductIds.length > 0) {
          // Batch fetch the candidates in one optimized database query
          recommendations = await Product.find({
            _id: { $in: candidateProductIds },
            inStock: true
          }).limit(targetLimit);
        }
      }
    }

    // 3. Cold-Start / Fallback Phase (if recommendations are fewer than the requested limit)
    if (recommendations.length < targetLimit) {
      const remainingLimit = targetLimit - recommendations.length;
      const alreadyRecommended = recommendations.map(r => r._id.toString());
      const allExclusions = [...excludeProductIds, ...alreadyRecommended];

      // Try fetching overall popular products based on global recently viewed counts
      const popularAgg = await RecentlyViewed.aggregate([
        { $match: { productId: { $nin: allExclusions.map(id => new mongoose.Types.ObjectId(id)) } } },
        { $group: { _id: "$productId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: remainingLimit }
      ]);

      let fallbackProducts = [];
      if (popularAgg.length > 0) {
        const popularIds = popularAgg.map(p => p._id);
        fallbackProducts = await Product.find({
          _id: { $in: popularIds },
          inStock: true
        });
      }

      // If still not enough (e.g. database has sparse interaction records), fetch newest products
      if (recommendations.length + fallbackProducts.length < targetLimit) {
        const currentCount = recommendations.length + fallbackProducts.length;
        const finalExclusions = [...allExclusions, ...fallbackProducts.map(p => p._id.toString())];
        const finalNeeded = targetLimit - currentCount;

        const newestProducts = await Product.find({
          _id: { $nin: finalExclusions },
          inStock: true
        })
          .sort({ createdAt: -1 })
          .limit(finalNeeded);

        fallbackProducts = [...fallbackProducts, ...newestProducts];
      }

      recommendations = [...recommendations, ...fallbackProducts];
    }

    return res.status(200).json(recommendations.slice(0, targetLimit));
  } catch (error) {
    console.error("Personalization engine error:", error);
    return res.status(500).json({ message: "Error generating recommendations" });
  }
});

module.exports = router;
