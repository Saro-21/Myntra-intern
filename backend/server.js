const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userrouter = require("./routes/Userroutes");
const categoryrouter = require("./routes/Categoryroutes");
const productrouter = require("./routes/Productroutes");
const Bagroutes = require("./routes/Bagroutes");
const Wishlistroutes = require("./routes/Wishlistroutes");
const OrderRoutes = require("./routes/OrderRoutes");
const RecentlyViewedroutes = require("./routes/RecentlyViewedroutes");
const { router: notificationrouter, runQueueWorkerInternal } = require("./routes/Notificationroutes");
const cors = require('cors');
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.get("/", (req, res) => {
  res.send("✅ Myntra backend in working");
});
app.use("/user", userrouter);
app.use("/category", categoryrouter);
app.use("/product", productrouter);
app.use("/bag", Bagroutes);
app.use("/wishlist", Wishlistroutes);
app.use("/Order", OrderRoutes);
app.use("/recently-viewed", RecentlyViewedroutes);
app.use("/notification", notificationrouter);

// Start background job queue processor (runs every 10 seconds)
setInterval(async () => {
  try {
    await runQueueWorkerInternal();
  } catch (err) {
    console.error("Background worker interval run failed:", err);
  }
}, 10000);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Mongodb connected");
  })
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
