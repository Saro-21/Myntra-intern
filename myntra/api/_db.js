// ─── Set DNS BEFORE anything else runs ───────────────────────────────────────
// Vercel's serverless environment sometimes defaults to non-SRV-capable DNS.
// Explicitly set Google & Cloudflare DNS at module load time.
try {
  const dns = require("dns");
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  console.warn("Warning: Failed to set custom DNS servers:", e.message);
}

const mongoose = require("mongoose");

let cached = global.__mongoCache;
if (!cached) {
  cached = global.__mongoCache = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    // Verify the connection is still alive
    if (cached.conn.readyState === 1) {
      return cached.conn;
    }
    // Connection was lost, reset cache
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    };

    console.log("Connecting to MongoDB...");
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, opts)
      .then((m) => {
        console.log("MongoDB connected successfully");
        return m.connection;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Discard failed promise so next call retries
    console.error("MongoDB connection failed:", e.message);
    throw e;
  }

  return cached.conn;
}

module.exports = connectDB;
