const connectDB = require("../_db");
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  { name: String, brand: String, price: Number, discount: String, description: String, sizes: [String], images: [String] },
  { timestamps: true }
);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  await connectDB();
  const { id } = req.query;
  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  return res.json(product);
};
