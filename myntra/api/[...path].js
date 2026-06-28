const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const bcrypt = require("bcryptjs");

// ─── DB Connection (cached across warm invocations) ─────────────────────────
let cached = global.__mongoCache || { conn: null, promise: null };
global.__mongoCache = cached;

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI)
      .then((m) => m.connection);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// ─── Schemas / Models ───────────────────────────────────────────────────────
const ProductSchema = new mongoose.Schema(
  { name: String, brand: String, price: Number, discount: String, description: String, sizes: [String], images: [String] },
  { timestamps: true }
);
const CategorySchema = new mongoose.Schema(
  { name: String, subcategory: [String], image: String, productId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }] },
  { timestamps: true }
);
const UserSchema = new mongoose.Schema(
  { fullName: { type: String, required: true }, email: { type: String, required: true, unique: true, lowercase: true }, password: { type: String, required: true } },
  { timestamps: true }
);
const BagSchema = new mongoose.Schema(
  { userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, size: String, quantity: Number },
  { timestamps: true }
);
const WishlistSchema = new mongoose.Schema(
  { userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" } },
  { timestamps: true }
);
const TimelineSchema = new mongoose.Schema({ status: String, location: String, timestamp: String });
const TrackingSchema = new mongoose.Schema({ number: String, carrier: String, estimatedDelivery: String, currentLocation: String, status: String, timeline: [TimelineSchema] });
const OrderItemSchema = new mongoose.Schema({ productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, size: String, price: Number, quantity: Number });
const OrderSchema = new mongoose.Schema(
  { userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, date: String, status: String, items: [OrderItemSchema], total: Number, shippingAddress: String, paymentMethod: String, tracking: TrackingSchema },
  { timestamps: true }
);
const RecentlyViewedSchema = new mongoose.Schema(
  { userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }, viewedAt: { type: Date, default: Date.now } },
  { timestamps: true }
);
RecentlyViewedSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Product        = mongoose.models.Product        || mongoose.model("Product", ProductSchema);
const Category       = mongoose.models.Category       || mongoose.model("Category", CategorySchema);
const User           = mongoose.models.User           || mongoose.model("User", UserSchema);
const Bag            = mongoose.models.Bag            || mongoose.model("Bag", BagSchema);
const Wishlist       = mongoose.models.Wishlist       || mongoose.model("Wishlist", WishlistSchema);
const Order          = mongoose.models.Order          || mongoose.model("Order", OrderSchema);
const RecentlyViewed = mongoose.models.RecentlyViewed || mongoose.model("RecentlyViewed", RecentlyViewedSchema);

// ─── CORS Helper ────────────────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

// ─── Parse query string from URL ────────────────────────────────────────────
function parseQuery(url) {
  const qIndex = (url || "").indexOf("?");
  if (qIndex === -1) return {};
  const params = {};
  for (const pair of url.slice(qIndex + 1).split("&")) {
    const [k, v] = pair.split("=");
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || "");
  }
  return params;
}

// ─── Main Handler ───────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();
  } catch (err) {
    return res.status(500).json({ message: "DB connection failed", error: err.message });
  }

  const raw = req.url || "";
  // Extract only the first path segment after /api/
  const trimmed = raw.replace(/^\/api\/?/, "").split("?")[0];
  const pathParts = trimmed ? trimmed.split("/").filter(Boolean) : [];
  const path0 = pathParts[0] || "";
  const method = req.method;

  // Use Vercel's parsed query or fallback to manual URL parsing
  const query = (req.query && Object.keys(req.query).length > 0)
    ? req.query
    : parseQuery(raw);

  try {
    // ── Health check ───────────────────────────────────────────────────────
    if (!path0) return res.json({ message: "Myntra API working on Vercel" });

    // ── PRODUCT ───────────────────────────────────────────────────────────
    // GET /api/product          → all products
    // GET /api/product?id=xxx   → single product by ID
    if (path0 === "product") {
      if (method === "GET" && query.id) {
        const product = await Product.findById(query.id);
        if (!product) return res.status(404).json({ message: "Not found" });
        return res.json(product);
      }
      if (method === "GET") {
        const products = await Product.find();
        return res.json(products);
      }
    }

    // ── CATEGORY ──────────────────────────────────────────────────────────
    // GET /api/category → all categories with populated products
    if (path0 === "category" && method === "GET") {
      const cats = await Category.find().populate("productId");
      return res.json(cats);
    }

    // ── USER ──────────────────────────────────────────────────────────────
    // POST /api/user?action=login   → login
    // POST /api/user?action=signup  → signup
    if (path0 === "user" && method === "POST") {
      if (query.action === "login") {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(400).json({ message: "Invalid password" });
        return res.json({ user });
      }
      if (query.action === "signup") {
        const { fullName, email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: "Email already in use" });
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ fullName, email, password: hashed });
        return res.json({ user });
      }
    }

    // ── BAG ───────────────────────────────────────────────────────────────
    // POST   /api/bag                  → add item to bag
    // GET    /api/bag?userId=xxx       → get bag items for user
    // DELETE /api/bag?itemId=xxx       → remove item from bag
    if (path0 === "bag") {
      if (method === "POST") {
        const { userId, productId, size, quantity } = req.body;
        const item = await Bag.create({ userId, productId, size: size || "M", quantity: quantity || 1 });
        return res.json(item);
      }
      if (method === "GET" && query.userId) {
        const items = await Bag.find({ userId: query.userId }).populate("productId");
        return res.json(items);
      }
      if (method === "DELETE" && query.itemId) {
        await Bag.findByIdAndDelete(query.itemId);
        return res.json({ message: "Deleted" });
      }
    }

    // ── WISHLIST ──────────────────────────────────────────────────────────
    // POST   /api/wishlist               → add to wishlist
    // GET    /api/wishlist?userId=xxx    → get wishlist for user
    // DELETE /api/wishlist?itemId=xxx    → remove from wishlist
    if (path0 === "wishlist") {
      if (method === "POST") {
        const { userId, productId } = req.body;
        const item = await Wishlist.create({ userId, productId });
        return res.json(item);
      }
      if (method === "GET" && query.userId) {
        const items = await Wishlist.find({ userId: query.userId }).populate("productId");
        return res.json(items);
      }
      if (method === "DELETE" && query.itemId) {
        await Wishlist.findByIdAndDelete(query.itemId);
        return res.json({ message: "Deleted" });
      }
    }

    // ── ORDER ─────────────────────────────────────────────────────────────
    // POST /api/order?action=create&userId=xxx → create order from bag
    // GET  /api/order?userId=xxx               → get orders for user
    if (path0 === "order" || path0 === "Order") {
      if (method === "POST" && query.action === "create" && query.userId) {
        const { shippingAddress, paymentMethod } = req.body;
        const bagItems = await Bag.find({ userId: query.userId }).populate("productId");
        const total = bagItems.reduce((sum, i) => sum + (i.productId?.price || 0) * (i.quantity || 1), 0);
        const order = await Order.create({
          userId: query.userId,
          date: new Date().toLocaleDateString("en-IN"),
          status: "Processing",
          shippingAddress,
          paymentMethod,
          items: bagItems.map((i) => ({
            productId: i.productId._id,
            size: i.size,
            price: i.productId.price,
            quantity: i.quantity,
          })),
          total,
        });
        await Bag.deleteMany({ userId: query.userId });
        return res.json(order);
      }
      if (method === "GET" && query.userId) {
        const orders = await Order.find({ userId: query.userId }).populate("items.productId");
        return res.json(orders);
      }
    }

    // ── RECENTLY VIEWED ───────────────────────────────────────────────────
    // POST   /api/recently-viewed                  → log a product view
    // POST   /api/recently-viewed?action=sync      → sync local history
    // DELETE /api/recently-viewed?userId=xxx       → clear history
    // GET    /api/recently-viewed?userId=xxx       → get history
    if (path0 === "recently-viewed") {
      if (method === "POST" && query.action === "sync") {
        const { userId, localHistory } = req.body;
        for (const item of localHistory || []) {
          await RecentlyViewed.findOneAndUpdate(
            { userId, productId: item.productId },
            { viewedAt: new Date(item.viewedAt) },
            { upsert: true }
          );
        }
        const history = await RecentlyViewed.find({ userId })
          .sort({ viewedAt: -1 }).limit(20).populate("productId");
        return res.json(history.map((h) => h.productId));
      }
      if (method === "POST") {
        const { userId, productId } = req.body;
        await RecentlyViewed.findOneAndUpdate(
          { userId, productId }, { viewedAt: new Date() },
          { upsert: true, new: true }
        );
        return res.json({ message: "Logged" });
      }
      if (method === "DELETE" && query.userId) {
        await RecentlyViewed.deleteMany({ userId: query.userId });
        return res.json({ message: "Cleared" });
      }
      if (method === "GET" && query.userId) {
        const history = await RecentlyViewed.find({ userId: query.userId })
          .sort({ viewedAt: -1 }).limit(20).populate("productId");
        return res.json(history.map((h) => h.productId));
      }
    }

    return res.status(404).json({ message: "Route not found", path: path0, query });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
