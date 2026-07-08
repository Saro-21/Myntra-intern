const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://sarabhoji21:Sarabhoji%402102@sarabhoji.fxbd5sj.mongodb.net/myntra?retryWrites=true&w=majority";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection;
  
  // List collections
  const collections = await db.db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));

  // Find recent users
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }), "users");
  const users = await User.find().limit(5);
  console.log("Users:", users.map(u => ({ id: u._id, email: u.email, name: u.fullName })));

  // Find recent orders
  const Order = mongoose.model("Order", new mongoose.Schema({}, { strict: false }), "orders");
  const orders = await Order.find().sort({ createdAt: -1 }).limit(5);
  console.log("Orders:", orders.map(o => ({ id: o._id, userId: o.userId, total: o.total, date: o.date })));

  // Find recent transactions
  const Transaction = mongoose.model("Transaction", new mongoose.Schema({}, { strict: false }), "transactions");
  const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(5);
  console.log("Transactions:", transactions.map(t => ({ id: t._id, userId: t.userId, amount: t.amount, transactionId: t.transactionId, status: t.status })));

  await mongoose.disconnect();
}

run().catch(console.error);
