const express = require("express");
const RecentlyViewed = require("../models/RecentlyViewed");
const router = express.Router();

// Record a view (or update timestamp if already exists)
router.post("/", async (req, res) => {
  const { userId, productId, localHistory } = req.body;

  // Handle Sync action (matching Vercel serverless function style: POST /?action=sync)
  if (req.query.action === "sync") {
    if (!userId) {
      return res.status(400).json({ message: "userId is required for sync" });
    }
    try {
      for (const item of localHistory || []) {
        if (!item.productId) continue;
        await RecentlyViewed.findOneAndUpdate(
          { userId, productId: item.productId },
          { $max: { viewedAt: new Date(item.viewedAt) } },
          { upsert: true }
        );
      }
      const top50 = await RecentlyViewed.find({ userId })
        .sort({ viewedAt: -1 }).limit(50).select("_id");
      if (top50.length === 50) {
        const top50Ids = top50.map(h => h._id);
        await RecentlyViewed.deleteMany({ userId, _id: { $nin: top50Ids } });
      }
      const history = await RecentlyViewed.find({ userId })
        .sort({ viewedAt: -1 }).limit(20).populate("productId");
      return res.status(200).json(history.map(h => ({ productId: h.productId, viewedAt: h.viewedAt })));
    } catch (err) {
      console.error("Error in sync:", err);
      return res.status(500).json({ message: "Sync failed" });
    }
  }

  // Regular single view logging
  if (!userId || !productId) {
    return res.status(400).json({ message: "userId and productId are required" });
  }

  try {
    await RecentlyViewed.findOneAndUpdate(
      { userId, productId },
      { viewedAt: new Date() },
      { upsert: true, new: true }
    );

    const views = await RecentlyViewed.find({ userId }).sort({ viewedAt: -1 });
    if (views.length > 50) {
      const excessIds = views.slice(50).map(v => v._id);
      await RecentlyViewed.deleteMany({ _id: { $in: excessIds } });
    }

    const updatedViews = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: -1 })
      .populate("productId");

    res.status(200).json(updatedViews.map(h => ({ productId: h.productId, viewedAt: h.viewedAt })));
  } catch (error) {
    console.error("Error logging product view:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// GET endpoint (handles query parameters first, then falls back to original routes)
router.get("/", async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ message: "userId query parameter is required" });
  }
  try {
    const history = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: -1 })
      .limit(20)
      .populate("productId");
    res.status(200).json(history.map(h => ({ productId: h.productId, viewedAt: h.viewedAt })));
  } catch (error) {
    console.error("Error fetching recently viewed products:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// DELETE endpoint (handles query parameter userId first)
router.delete("/", async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ message: "userId query parameter is required" });
  }
  try {
    await RecentlyViewed.deleteMany({ userId });
    res.status(200).json({ message: "Recently viewed history cleared" });
  } catch (error) {
    console.error("Error clearing user history:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Keep original routes for backwards compatibility
router.post("/sync", async (req, res) => {
  const { userId, localHistory } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }
  try {
    for (const item of localHistory || []) {
      if (!item.productId) continue;
      await RecentlyViewed.findOneAndUpdate(
        { userId, productId: item.productId },
        { $max: { viewedAt: new Date(item.viewedAt) } },
        { upsert: true }
      );
    }
    const top50 = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: -1 }).limit(50).select("_id");
    if (top50.length === 50) {
      const top50Ids = top50.map(h => h._id);
      await RecentlyViewed.deleteMany({ userId, _id: { $nin: top50Ids } });
    }
    const history = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: -1 }).limit(20).populate("productId");
    res.status(200).json(history.map(h => ({ productId: h.productId, viewedAt: h.viewedAt })));
  } catch (error) {
    console.error("Error syncing recently viewed products:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/user/:userid", async (req, res) => {
  const { userid } = req.params;
  try {
    await RecentlyViewed.deleteMany({ userId: userid });
    res.status(200).json({ message: "Recently viewed history cleared" });
  } catch (error) {
    console.error("Error clearing user history:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/:userid", async (req, res) => {
  const { userid } = req.params;
  try {
    const views = await RecentlyViewed.find({ userId: userid })
      .sort({ viewedAt: -1 })
      .populate("productId");
    res.status(200).json(views.map(h => ({ productId: h.productId, viewedAt: h.viewedAt })));
  } catch (error) {
    console.error("Error fetching recently viewed products:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
