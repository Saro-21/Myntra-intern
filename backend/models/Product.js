const mongoose = require("mongoose");
const ProductSchema = new mongoose.Schema(
  {
    name: String,
    brand: String,
    price: Number,
    discount: String,
    description: String,
    sizes: [String],
    images: [String],
    // Stock count — used for cart checkout validation
    stock: {
      type: Number,
      default: 100,
      min: 0,
    },
    // Soft availability flag — allows graceful discontinuation
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);

