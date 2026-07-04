/**
 * Seed script: adds new products (shoes, leather bags, blazers, women accessories)
 * and creates/updates categories so they appear in Trending Now and Category sections.
 * Run: node backend/seeds/seedProducts.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: String, brand: String, price: Number, discount: String,
    description: String, sizes: [String], images: [String],
    stock: { type: Number, default: 100 }, inStock: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CategorySchema = new mongoose.Schema({
  name: String, subcategory: [String], image: String,
  productId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
}, { timestamps: true });

const Product  = mongoose.models.Product  || mongoose.model("Product",  ProductSchema);
const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);

const newProducts = [
  // ── SHOES ───────────────────────────────────────────────────────────────────
  {
    name: "Premium Leather Oxford Shoes",
    brand: "Carlton London",
    price: 3499,
    discount: "40% OFF",
    description: "Handcrafted genuine leather oxford shoes with a cushioned insole. A timeless classic for formal and smart-casual occasions.",
    sizes: ["UK6", "UK7", "UK8", "UK9", "UK10", "UK11"],
    images: [
      "https://images.unsplash.com/photo-1614252234399-6e3bda0c1e9b?w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1616606103915-dea7be788566?w=500&auto=format&fit=crop",
    ],
    stock: 80,
  },
  {
    name: "Classic White Sneakers",
    brand: "Puma",
    price: 2799,
    discount: "35% OFF",
    description: "Minimalist white leather sneakers with a memory-foam insole. Versatile enough for streetwear or light sport.",
    sizes: ["UK5", "UK6", "UK7", "UK8", "UK9", "UK10"],
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=500&auto=format&fit=crop",
    ],
    stock: 120,
  },
  {
    name: "Women's Block Heel Pumps",
    brand: "Steve Madden",
    price: 2199,
    discount: "30% OFF",
    description: "Elegant block heel pumps in faux suede. A must-have for every wardrobe, pairs beautifully with formals and dresses.",
    sizes: ["UK3", "UK4", "UK5", "UK6", "UK7"],
    images: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=500&auto=format&fit=crop",
    ],
    stock: 60,
  },
  {
    name: "Running Sports Shoes",
    brand: "Nike",
    price: 4999,
    discount: "25% OFF",
    description: "High-performance running shoes with air cushioning and breathable mesh upper. Perfect for daily runs and gym workouts.",
    sizes: ["UK6", "UK7", "UK8", "UK9", "UK10"],
    images: [
      "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500&auto=format&fit=crop",
    ],
    stock: 95,
  },

  // ── LEATHER PREMIUM BAGS ───────────────────────────────────────────────────
  {
    name: "Genuine Leather Tote Bag",
    brand: "Hidesign",
    price: 5999,
    discount: "20% OFF",
    description: "Full-grain vegetable-tanned leather tote with brass hardware. Spacious interior with suede lining and multiple pockets.",
    sizes: ["One Size"],
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop",
    ],
    stock: 40,
  },
  {
    name: "Premium Leather Crossbody Bag",
    brand: "Da Milano",
    price: 4499,
    discount: "15% OFF",
    description: "Soft pebbled leather crossbody with an adjustable strap. Perfect size for daily essentials with card slots and a zip closure.",
    sizes: ["One Size"],
    images: [
      "https://images.unsplash.com/photo-1591561954555-607968c989ab?w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&auto=format&fit=crop",
    ],
    stock: 50,
  },
  {
    name: "Men's Business Leather Briefcase",
    brand: "Fastrack",
    price: 6499,
    discount: "30% OFF",
    description: "Professional faux-leather briefcase with padded laptop compartment, document pockets and a detachable shoulder strap.",
    sizes: ["One Size"],
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&auto=format&fit=crop",
    ],
    stock: 35,
  },

  // ── BLAZERS ─────────────────────────────────────────────────────────────────
  {
    name: "Men's Slim-Fit Formal Blazer",
    brand: "Raymond",
    price: 3999,
    discount: "50% OFF",
    description: "Single-button slim-fit blazer in premium wool-blend fabric. Perfect for office, events and smart-casual looks.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=500&auto=format&fit=crop",
    ],
    stock: 70,
  },
  {
    name: "Women's Oversized Power Blazer",
    brand: "AND",
    price: 2799,
    discount: "45% OFF",
    description: "Chic oversized blazer in a rich jewel-tone fabric. Style over a tee or dress for an effortlessly polished look.",
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [
      "https://images.unsplash.com/photo-1551854994-b61b3d0fd3cf?w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1573497491765-55d998b7e37c?w=500&auto=format&fit=crop",
    ],
    stock: 55,
  },
  {
    name: "Checked Tweed Blazer",
    brand: "Mango",
    price: 4599,
    discount: "35% OFF",
    description: "Classic British tweed blazer in a bold windowpane check. Fully lined with a structured silhouette.",
    sizes: ["S", "M", "L", "XL"],
    images: [
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1598808503491-c8cdbe30be94?w=500&auto=format&fit=crop",
    ],
    stock: 45,
  },

  // ── WOMEN'S ACCESSORIES ────────────────────────────────────────────────────
  {
    name: "Boho Floral Printed Silk Scarf",
    brand: "W",
    price: 799,
    discount: "60% OFF",
    description: "Lightweight 100% silk twill scarf with a gorgeous floral print. Wear as a headscarf, neck tie or bag accessory.",
    sizes: ["One Size"],
    images: [
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1597348989645-df94c5b93a5c?w=500&auto=format&fit=crop",
    ],
    stock: 150,
  },
  {
    name: "Statement Pearl Drop Earrings",
    brand: "Accessorize",
    price: 499,
    discount: "40% OFF",
    description: "Elegant freshwater pearl drop earrings on gold-plated sterling silver hooks. The perfect finishing touch.",
    sizes: ["One Size"],
    images: [
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=500&auto=format&fit=crop",
    ],
    stock: 200,
  },
  {
    name: "Layered Bead & Chain Bracelet Set",
    brand: "Aldo",
    price: 699,
    discount: "55% OFF",
    description: "Set of 3 stackable bracelets — beaded, delicate chain and charm — in rose gold tone. Gift-ready packaging included.",
    sizes: ["One Size"],
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=500&auto=format&fit=crop",
    ],
    stock: 180,
  },
  {
    name: "Wide-Brim Sun Hat",
    brand: "Vero Moda",
    price: 999,
    discount: "30% OFF",
    description: "Straw wide-brim sun hat with a satin ribbon band. UV protective, packable and perfect for beach or garden parties.",
    sizes: ["One Size"],
    images: [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=500&auto=format&fit=crop",
    ],
    stock: 90,
  },
];

const categoryMap = {
  "Shoes":           { subcategory: ["Formal Shoes", "Sneakers", "Heels", "Sports Shoes"], image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop" },
  "Premium Bags":    { subcategory: ["Tote Bags", "Crossbody Bags", "Briefcases", "Clutches"], image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop" },
  "Blazers":         { subcategory: ["Men's Blazers", "Women's Blazers", "Casual Blazers", "Formal Blazers"], image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop" },
  "Women Accessories": { subcategory: ["Scarves", "Earrings", "Bracelets", "Hats & Caps"], image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=400&auto=format&fit=crop" },
};

// Which product names belong to which category
const productCategoryMap = {
  "Shoes":              ["Premium Leather Oxford Shoes", "Classic White Sneakers", "Women's Block Heel Pumps", "Running Sports Shoes"],
  "Premium Bags":       ["Genuine Leather Tote Bag", "Premium Leather Crossbody Bag", "Men's Business Leather Briefcase"],
  "Blazers":            ["Men's Slim-Fit Formal Blazer", "Women's Oversized Power Blazer", "Checked Tweed Blazer"],
  "Women Accessories":  ["Boho Floral Printed Silk Scarf", "Statement Pearl Drop Earrings", "Layered Bead & Chain Bracelet Set", "Wide-Brim Sun Hat"],
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const insertedProducts = [];
    for (const p of newProducts) {
      const existing = await Product.findOne({ name: p.name });
      if (existing) {
        console.log(`  ↩ Already exists: ${p.name}`);
        insertedProducts.push(existing);
      } else {
        const doc = await Product.create(p);
        insertedProducts.push(doc);
        console.log(`  ✅ Inserted: ${p.name}`);
      }
    }

    for (const [catName, catMeta] of Object.entries(categoryMap)) {
      const productNames = productCategoryMap[catName] || [];
      const productIds = insertedProducts
        .filter(p => productNames.includes(p.name))
        .map(p => p._id);

      const existing = await Category.findOne({ name: catName });
      if (existing) {
        // Merge new product ids without duplicates
        const merged = Array.from(new Set([...existing.productId.map(String), ...productIds.map(String)]));
        existing.productId = merged;
        existing.subcategory = catMeta.subcategory;
        existing.image = catMeta.image;
        await existing.save();
        console.log(`  🔄 Updated category: ${catName} (${merged.length} products)`);
      } else {
        await Category.create({ name: catName, ...catMeta, productId: productIds });
        console.log(`  ✅ Created category: ${catName} (${productIds.length} products)`);
      }
    }

    console.log("\n🎉 Seed complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
}

seed();
