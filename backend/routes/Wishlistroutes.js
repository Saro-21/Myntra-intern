const express = require("express");
const Wishlist = require("../models/Wishlist");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const Wishlists = new Wishlist(req.body);
    const saveitem = await Wishlists.save();
    res.status(200).json(saveitem);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId query parameter is required" });
    }
    const wishlist = await Wishlist.find({ userId }).populate("productId");
    res.status(200).json(wishlist);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const itemId = req.query.itemId;
    if (!itemId) {
      return res.status(400).json({ message: "itemId query parameter is required" });
    }
    await Wishlist.findByIdAndDelete(itemId);
    res.status(200).json({ message: "Item removed from Wishlist" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error removing item from Wishlist" });
  }
});

router.get("/:userid", async (req, res) => {
  try {
    const bag = await Wishlist.find({ userId: req.params.userid }).populate(
      "productId"
    );
    res.status(200).json(bag);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/:itemid", async (req, res) => {
  try {
    await Wishlist.findByIdAndDelete(req.params.itemid);
    res.status(200).json({ message: "Item removed from Wishlist" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error removing item from Wishlist" });
  }
});
module.exports = router;
