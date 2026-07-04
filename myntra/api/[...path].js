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

const PushTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  token: { type: String, required: true, unique: true },
  deviceType: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const JobSchema = new mongoose.Schema({
  type: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  lastError: { type: String, default: null }
}, { timestamps: true });

const NotificationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sentAt: { type: Date, default: Date.now }
});

const Product        = mongoose.models.Product        || mongoose.model("Product", ProductSchema);
const Category       = mongoose.models.Category       || mongoose.model("Category", CategorySchema);
const User           = mongoose.models.User           || mongoose.model("User", UserSchema);
const Bag            = mongoose.models.Bag            || mongoose.model("Bag", BagSchema);
const Wishlist       = mongoose.models.Wishlist       || mongoose.model("Wishlist", WishlistSchema);
const Order          = mongoose.models.Order          || mongoose.model("Order", OrderSchema);
const RecentlyViewed = mongoose.models.RecentlyViewed || mongoose.model("RecentlyViewed", RecentlyViewedSchema);
const PushToken       = mongoose.models.PushToken       || mongoose.model("PushToken", PushTokenSchema);
const Notification    = mongoose.models.Notification    || mongoose.model("Notification", NotificationSchema);
const Job             = mongoose.models.Job             || mongoose.model("Job", JobSchema);
const NotificationLog = mongoose.models.NotificationLog || mongoose.model("NotificationLog", NotificationLogSchema);

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

// ─── Worker Function ────────────────────────────────────────────────────────
async function runQueueWorkerInternal() {
  const processed = [];
  const errors = [];
  
  try {
    const jobs = await Job.find({
      status: "pending",
      scheduledAt: { $lte: new Date() }
    });

    for (const job of jobs) {
      // Check if this is a cart abandonment job, and verify if the cart is still active
      if (job.type === "CART_ABANDONMENT") {
        const bagCount = await Bag.countDocuments({ userId: job.userId });
        if (bagCount === 0) {
          job.status = "completed";
          job.lastError = "Cart was emptied or order completed, skipped notification.";
          await job.save();
          processed.push({ jobId: job._id, status: "completed", skipped: true });
          continue;
        }
      }

      // Enforce rate limiting: max 5 notifications per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await NotificationLog.countDocuments({
        userId: job.userId,
        sentAt: { $gte: oneHourAgo }
      });

      if (recentCount >= 5) {
        job.status = "failed";
        job.lastError = `Rate limit exceeded: Sent ${recentCount} notifications in the last hour. Limit is 5.`;
        await job.save();
        processed.push({ jobId: job._id, status: "failed", error: "Rate limit exceeded" });
        continue;
      }

      job.status = "processing";
      job.attempts += 1;
      await job.save();

      try {
        const tokens = await PushToken.find({ userId: job.userId });
        let pushSucceeded = false;
        let invalidTokens = [];

        if (tokens.length > 0) {
          const messages = tokens.map(t => ({
            to: t.token,
            sound: "default",
            title: job.title,
            body: job.body,
            data: job.data
          }));

          const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Accept-Encoding": "gzip, deflate"
            },
            body: JSON.stringify(messages)
          });

          if (!response.ok) {
            throw new Error(`Expo API error: ${response.statusText}`);
          }

          const result = await response.json();
          if (result.data && Array.isArray(result.data)) {
            result.data.forEach((ticket, idx) => {
              const currentToken = tokens[idx];
              if (ticket.status === "error") {
                if (ticket.details && ticket.details.error === "DeviceNotRegistered") {
                  invalidTokens.push(currentToken.token);
                }
              }
            });
            pushSucceeded = true;
          }
        } else {
          // Fallback if no push tokens: we succeed the job at history log level
          pushSucceeded = true;
        }

        if (invalidTokens.length > 0) {
          await PushToken.deleteMany({ token: { $in: invalidTokens } });
        }

        if (pushSucceeded) {
          await Notification.create({
            userId: job.userId,
            title: job.title,
            body: job.body,
            data: job.data
          });

          await NotificationLog.create({
            userId: job.userId,
            sentAt: new Date()
          });

          job.status = "completed";
          job.lastError = null;
          await job.save();
          processed.push({ jobId: job._id, status: "completed", removedTokens: invalidTokens.length });
        } else {
          throw new Error("Push attempt did not succeed");
        }
      } catch (err) {
        job.lastError = err.message;
        if (job.attempts >= job.maxAttempts) {
          job.status = "failed";
        } else {
          job.status = "pending";
        }
        await job.save();
        errors.push({ jobId: job._id, attempt: job.attempts, error: err.message });
      }
    }
  } catch (error) {
    return { success: false, error: error.message };
  }

  return { success: true, processedJobs: processed.length, failedAttempts: errors.length, processed, errors };
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
        
        // Schedule cart abandonment reminder (scheduled for 2 minutes from now)
        try {
          if (userId) {
            const existingJob = await Job.findOne({ userId, type: "CART_ABANDONMENT", status: "pending" });
            if (!existingJob) {
              await Job.create({
                type: "CART_ABANDONMENT",
                userId,
                title: "Cart Abandoned 🛒",
                body: "You left items in your cart! Complete your order now and enjoy exclusive discounts.",
                scheduledAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes for testing
                status: "pending"
              });
            }
          }
        } catch (e) {
          console.error("Failed to schedule cart abandonment job:", e.message);
        }

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

        // Clean up pending cart abandonment jobs and send real-time order update notification
        try {
          await Job.deleteMany({ userId: query.userId, type: "CART_ABANDONMENT", status: "pending" });
          
          await Job.create({
            type: "REALTIME_PUSH",
            userId: query.userId,
            title: "Order Placed Successfully! 🎉",
            body: `Your order for ₹${total} has been received and is being processed.`,
            data: { type: "order_update", orderId: order._id.toString() },
            scheduledAt: new Date(),
            status: "pending"
          });

          // Run worker synchronously to send the notification immediately
          await runQueueWorkerInternal();
        } catch (e) {
          console.error("Order notification triggers failed:", e.message);
        }

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
        // Upsert each local item, using the most recent viewedAt for deduplication
        for (const item of localHistory || []) {
          if (!item.productId) continue;
          await RecentlyViewed.findOneAndUpdate(
            { userId, productId: item.productId },
            { $max: { viewedAt: new Date(item.viewedAt) } },
            { upsert: true }
          );
        }
        // Enforce 20-item limit: delete anything beyond top 20 by viewedAt
        const top20 = await RecentlyViewed.find({ userId })
          .sort({ viewedAt: -1 }).limit(20).select("_id");
        if (top20.length === 20) {
          const top20Ids = top20.map(h => h._id);
          await RecentlyViewed.deleteMany({ userId, _id: { $nin: top20Ids } });
        }
        // Return full history with populated product and viewedAt
        const history = await RecentlyViewed.find({ userId })
          .sort({ viewedAt: -1 }).limit(20).populate("productId");
        return res.json(history.map((h) => ({ productId: h.productId, viewedAt: h.viewedAt })));
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
        return res.json(history.map((h) => ({ productId: h.productId, viewedAt: h.viewedAt })));
      }
    }

    // ── NOTIFICATION & JOB QUEUE ──────────────────────────────────────────
    if (path0 === "notification") {
      // POST /api/notification?action=register
      if (method === "POST" && query.action === "register") {
        const { userId, token, deviceType } = req.body;
        if (!token) return res.status(400).json({ message: "Token is required" });
        const entry = await PushToken.findOneAndUpdate(
          { token },
          { userId: userId || null, deviceType: deviceType || "web" },
          { upsert: true, new: true }
        );
        return res.json({ message: "Token registered", entry });
      }

      // POST /api/notification?action=unregister
      if (method === "POST" && query.action === "unregister") {
        const { token } = req.body;
        await PushToken.deleteOne({ token });
        return res.json({ message: "Token unregistered" });
      }

      // GET /api/notification?userId=xxx
      if (method === "GET" && query.userId) {
        const filter = { userId: query.userId };
        if (query.unread === "true") {
          filter.read = false;
        }
        const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
        return res.json(notifications);
      }

      // POST /api/notification?action=mark-read
      if (method === "POST" && query.action === "mark-read") {
        const { userId, notificationId, all } = req.body;
        if (all) {
          await Notification.updateMany({ userId }, { read: true });
        } else if (notificationId) {
          await Notification.findByIdAndUpdate(notificationId, { read: true });
        }
        return res.json({ message: "Marked as read" });
      }

      // GET /api/notification?action=jobs-status&userId=xxx
      if (method === "GET" && query.action === "jobs-status" && query.userId) {
        const jobs = await Job.find({ userId: query.userId }).sort({ createdAt: -1 }).limit(30);
        const logsCount = await NotificationLog.countDocuments({
          userId: query.userId,
          sentAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
        });
        return res.json({ jobs, hourlyCount: logsCount });
      }

      // DELETE /api/notification?action=reset-jobs&userId=xxx
      if (method === "DELETE" && query.action === "reset-jobs" && query.userId) {
        await Job.deleteMany({ userId: query.userId });
        await Notification.deleteMany({ userId: query.userId });
        await NotificationLog.deleteMany({ userId: query.userId });
        return res.json({ message: "Test data reset successfully" });
      }

      // POST /api/notification?action=trigger-realtime
      if (method === "POST" && query.action === "trigger-realtime") {
        const { userId, title, body, data } = req.body;
        if (!userId) return res.status(400).json({ message: "userId is required" });
        
        const job = await Job.create({
          type: "REALTIME_PUSH",
          userId,
          title: title || "Real-time Order Update 📦",
          body: body || "Your Myntra order has been packed and is ready for dispatch!",
          data: data || { type: "order_update", orderId: "12345" },
          scheduledAt: new Date(),
          status: "pending"
        });

        const runResult = await runQueueWorkerInternal();
        return res.json({ message: "Real-time job triggered", job, runResult });
      }

      // POST /api/notification?action=trigger-scheduled
      if (method === "POST" && query.action === "trigger-scheduled") {
        const { userId, title, body, data, delayMinutes } = req.body;
        if (!userId) return res.status(400).json({ message: "userId is required" });
        const delay = delayMinutes ? parseInt(delayMinutes, 10) : 2;

        const job = await Job.create({
          type: "SCHEDULED_PUSH",
          userId,
          title: title || "Special Discount Waiting! 💃",
          body: body || "Hurry! Items in your wishlist are at 40% discount for the next 1 hour.",
          data: data || { type: "wishlist_sale" },
          scheduledAt: new Date(Date.now() + delay * 60 * 1000),
          status: "pending"
        });

        return res.json({ message: "Scheduled job enqueued", job });
      }

      // POST /api/notification?action=run-jobs
      if (method === "POST" && query.action === "run-jobs") {
        const runResult = await runQueueWorkerInternal();
        return res.json(runResult);
      }
      
      return res.status(400).json({ message: "Invalid notification action" });
    }

    return res.status(404).json({ message: "Route not found", path: path0, query });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
