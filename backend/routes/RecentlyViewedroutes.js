const express = require("express");
const RecentlyViewed = require("../models/RecentlyViewed");
const router = express.Router();

// Record a view (or update timestamp if already exists)
router.post("/", async (req, res) => {
  const { userId, productId } = req.body;
  if (!userId || !productId) {
    return res.status(400).json({ message: "userId and productId are required" });
  }

  try {
    // Upsert the view record with the latest timestamp
    await RecentlyViewed.findOneAndUpdate(
      { userId, productId },
      { viewedAt: new Date() },
      { upsert: true, new: true }
    );

    // Limit to 20 items: find all views for the user, sorted by viewedAt desc
    const views = await RecentlyViewed.find({ userId }).sort({ viewedAt: -1 });
    if (views.length > 20) {
      const excessIds = views.slice(20).map(v => v._id);
      await RecentlyViewed.deleteMany({ _id: { $in: excessIds } });
    }

    // Get updated top 20 populated views
    const updatedViews = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: -1 })
      .populate("productId");

    res.status(200).json(updatedViews);
  } catch (error) {
    console.error("Error logging product view:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// IMPORTANT: /sync must be BEFORE /:userid to avoid Express matching "sync" as a userid param
// Sync local anonymous views with server views
router.post("/sync", async (req, res) => {
  const { userId, localHistory } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    // 1. Fetch server history
    const serverViews = await RecentlyViewed.find({ userId });

    // 2. Build a map of productId -> viewedAt Date
    const mergedMap = new Map();

    // Populate map with server views
    serverViews.forEach(v => {
      if (v.productId) {
        mergedMap.set(v.productId.toString(), new Date(v.viewedAt));
      }
    });

    // Merge local history
    if (Array.isArray(localHistory)) {
      localHistory.forEach(item => {
        if (item.productId) {
          const localDate = new Date(item.viewedAt);
          const prodIdStr = item.productId.toString();
          if (mergedMap.has(prodIdStr)) {
            // Keep the newer timestamp
            if (localDate > mergedMap.get(prodIdStr)) {
              mergedMap.set(prodIdStr, localDate);
            }
          } else {
            mergedMap.set(prodIdStr, localDate);
          }
        }
      });
    }

    // Convert map to sorted array and limit to 20
    const sortedMerged = Array.from(mergedMap.entries())
      .map(([productId, viewedAt]) => ({ productId, viewedAt }))
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, 20);

    // 3. Update database: Delete old records and insert new ones
    await RecentlyViewed.deleteMany({ userId });

    if (sortedMerged.length > 0) {
      const docsToInsert = sortedMerged.map(item => ({
        userId,
        productId: item.productId,
        viewedAt: item.viewedAt
      }));
      await RecentlyViewed.insertMany(docsToInsert);
    }

    // 4. Retrieve and populate the merged list to return
    const finalViews = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: -1 })
      .populate("productId");

    res.status(200).json(finalViews);
  } catch (error) {
    console.error("Error syncing recently viewed products:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Delete user recently viewed history - must be before /:userid
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

// Get views for a user - must be LAST to not shadow other routes
router.get("/:userid", async (req, res) => {
  const { userid } = req.params;
  try {
    const views = await RecentlyViewed.find({ userId: userid })
      .sort({ viewedAt: -1 })
      .populate("productId");
    res.status(200).json(views);
  } catch (error) {
    console.error("Error fetching recently viewed products:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
