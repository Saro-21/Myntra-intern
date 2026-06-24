const connectDB = require("../_db");
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  { name: String, brand: String, price: Number, discount: String, description: String, sizes: [String], images: [String] },
  { timestamps: true }
);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  await connectDB();
  if (req.method === "GET") {
    const products = await Product.find();
    return res.json(products);
  }
  return res.status(405).json({ message: "Method not allowed" });
};
