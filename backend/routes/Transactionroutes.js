const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const Transaction = require("../models/Transaction");
const AuditLog = require("../models/AuditLog");
const Order = require("../models/Order");

const JWT_SECRET = process.env.JWT_SECRET || "myntra_secret_key";

// Helper to generate signed receipt links
function generateReceiptLink(host, transactionId) {
  const expires = Date.now() + 15 * 60 * 1000; // 15 mins expiry
  const data = `${transactionId}:${expires}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(data).digest("hex");
  return `http://${host}/transaction/receipt/${transactionId}?expires=${expires}&signature=${signature}`;
}

// Helper to verify signed receipt links
function verifyReceiptLink(transactionId, expires, signature) {
  if (Date.now() > parseInt(expires, 10)) {
    return false;
  }
  const data = `${transactionId}:${expires}`;
  const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(data).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (e) {
    return false;
  }
}

// 1. GET /transaction - Fetch transactions with filtering, sorting, and cursor pagination
router.get("/", async (req, res) => {
  const { userId, status, paymentMethod, startDate, endDate, cursor, limit = 10 } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const queryLimit = parseInt(limit, 10);
  const filter = { userId };

  // Status Filter
  if (status) {
    filter.status = status;
  }

  // Payment Method Filter
  if (paymentMethod) {
    filter.paymentMethod = paymentMethod;
  }

  // Date Range Filter
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }

  // Cursor-based pagination (using base64 encoded createdAt)
  if (cursor) {
    try {
      const decodedDate = new Date(Buffer.from(cursor, "base64").toString("ascii"));
      if (!isNaN(decodedDate.getTime())) {
        if (!filter.createdAt) filter.createdAt = {};
        filter.createdAt.$lt = decodedDate; // Get items older than the cursor
      }
    } catch (e) {
      return res.status(400).json({ message: "Invalid cursor" });
    }
  }

  const sortDir = sort === "asc" ? 1 : -1;

  try {
    // Fetch queryLimit + 1 items to check if there is a next page
    const transactions = await Transaction.find(filter)
      .populate({ path: "orderId", populate: { path: "items.productId" } })
      .sort({ createdAt: sortDir })
      .limit(queryLimit + 1);

    const hasNextPage = transactions.length > queryLimit;
    const results = hasNextPage ? transactions.slice(0, queryLimit) : transactions;

    // Map receipt links dynamically
    const host = req.get("host");
    const formattedResults = results.map(t => {
      const plainObj = t.toObject();
      plainObj.receiptUrl = generateReceiptLink(host, t._id.toString());
      if (plainObj.orderId && plainObj.orderId.items) {
        plainObj.items = plainObj.orderId.items.map(item => ({
          name: item.productId?.name || item.name || "Product",
          brand: item.productId?.brand || "",
          image: item.productId?.images?.[0] || null,
          size: item.size || "—",
          quantity: item.quantity || 1,
          price: item.price || 0,
          lineTotal: (item.price || 0) * (item.quantity || 1)
        }));
        plainObj.shippingAddress = plainObj.orderId.shippingAddress || "";
      }
      return plainObj;
    });

    let nextCursor = null;
    if (hasNextPage && results.length > 0) {
      const lastItem = results[results.length - 1];
      nextCursor = Buffer.from(lastItem.createdAt.toISOString()).toString("base64");
    }

    res.status(200).json({
      data: formattedResults,
      nextCursor,
      hasNextPage,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// 2. GET /transaction/export - Stream CSV generation for large exports (also supports /export/csv)
router.get(["/export", "/export/csv"], async (req, res) => {
  const { userId, status, paymentMethod, startDate, endDate } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const filter = { userId };

  if (status) filter.status = status;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  try {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="transactions_${userId}.csv"`);
    
    // Write CSV Headers
    res.write("Transaction ID,Amount,Status,Payment Method,Date,Receipt Link\n");

    const host = req.get("host");
    // Fetch via mongoose cursor to stream data sequentially without memory overload
    const cursor = Transaction.find(filter).sort({ createdAt: -1 }).cursor();

    cursor.on("data", (doc) => {
      const dateStr = doc.createdAt.toISOString();
      const receiptLink = generateReceiptLink(host, doc._id.toString());
      const row = `"${doc.transactionId}",${doc.amount},"${doc.status}","${doc.paymentMethod}","${dateStr}","${receiptLink}"\n`;
      res.write(row);
    });

    cursor.on("end", () => {
      res.end();
    });

    cursor.on("error", (err) => {
      console.error("Cursor streaming error:", err);
      res.status(500).end();
    });
  } catch (error) {
    console.error("CSV Export error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// 3. GET /transaction/receipt/:id - Secure, cryptographically verified PDF receipt generation
router.get("/receipt/:id", async (req, res) => {
  const { id } = req.params;
  const { expires, signature } = req.query;

  if (!expires || !signature) {
    return res.status(403).json({ message: "Forbidden: Signed link credentials missing." });
  }

  const isValid = verifyReceiptLink(id, expires, signature);
  if (!isValid) {
    return res.status(403).json({ message: "Forbidden: Receipt link is expired or signature is invalid." });
  }

  try {
    const transaction = await Transaction.findById(id).populate("userId");
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Retrieve order items if order exists
    let orderItems = [];
    if (transaction.orderId) {
      const ord = await Order.findById(transaction.orderId).populate("items.productId");
      if (ord) {
        orderItems = ord.items || [];
      }
    }

    // Flatten items so that if quantity > 1, it appears on separate rows as requested
    const displayItems = [];
    if (orderItems.length > 0) {
      orderItems.forEach(item => {
        const qty = item.quantity || 1;
        for (let i = 0; i < qty; i++) {
          displayItems.push({
            name: item.productId?.name || item.name || "Product",
            brand: item.productId?.brand || "",
            size: item.size || "—",
            price: item.price || (transaction.amount / qty),
          });
        }
      });
    } else {
      displayItems.push({
        name: "Online Retail Purchase - Items shipped per Order Reference",
        brand: "",
        size: "—",
        price: transaction.amount,
      });
    }

    // Initialize beautiful PDF Document
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="receipt_${transaction.transactionId}.pdf"`);
    
    doc.pipe(res);

    // Decorative Header (Myntra Colors / Design aesthetics)
    doc.fillColor("#E7396A") // Myntra Pink
       .rect(0, 0, 595, 30) // top strip
       .fill();

    doc.fillColor("#333333");
    
    // Title
    doc.fontSize(22)
       .font("Helvetica-Bold")
       .text("MYNTRA CLONE TRANSACTION RECEIPT", 50, 60);

    // Invoice Subtitle
    doc.fontSize(10)
       .font("Helvetica")
       .fillColor("#777777")
       .text(`Invoice Issued: ${new Date().toLocaleString("en-IN")}`, 50, 85);

    doc.strokeColor("#E0E0E0")
       .lineWidth(1)
       .moveTo(50, 105)
       .lineTo(545, 105)
       .stroke();

    // Bill to Details
    doc.fillColor("#333333")
       .fontSize(12)
       .font("Helvetica-Bold")
       .text("Billed To:", 50, 125);
    
    doc.fontSize(10)
       .font("Helvetica")
       .text(`Customer Name: ${transaction.userId?.fullName || "Guest Customer"}`)
       .text(`Email: ${transaction.userId?.email || "N/A"}`);

    // Receipt Metadata table
    doc.fontSize(12)
       .font("Helvetica-Bold")
       .text("Transaction Summary", 300, 125);

    doc.fontSize(10)
       .font("Helvetica")
       .text(`Transaction ID: ${transaction.transactionId}`, 300, 140)
       .text(`Status: ${transaction.status.toUpperCase()}`)
       .text(`Payment Mode: ${transaction.paymentMethod.toUpperCase()}`)
       .text(`Date: ${transaction.createdAt.toLocaleString("en-IN")}`);

    doc.strokeColor("#E0E0E0")
       .moveTo(50, 205)
       .lineTo(545, 205)
       .stroke();

    // Main table headers
    const tableTop = 220;
    doc.strokeColor("#E0E0E0").moveTo(50, tableTop - 5).lineTo(545, tableTop - 5).stroke();
    doc.fillColor("#F5F5F5").rect(50, tableTop, 495, 20).fill();
    doc.fillColor("#333333").fontSize(9).font("Helvetica-Bold")
       .text("#", 54, tableTop + 5)
       .text("Item / Product Description", 75, tableTop + 5)
       .text("Size", 350, tableTop + 5)
       .text("Qty", 400, tableTop + 5)
       .text("Amount (INR)", 450, tableTop + 5, { align: "right" });

    let rowY = tableTop + 24;
    displayItems.forEach((item, idx) => {
      if (idx % 2 === 1) doc.fillColor("#FAFAFA").rect(50, rowY - 2, 495, 18).fill();
      const desc = item.brand ? `${item.brand} — ${item.name}` : item.name;
      doc.fillColor("#333333").fontSize(8).font("Helvetica")
         .text(String(idx + 1), 54, rowY)
         .text(desc, 75, rowY, { width: 260 })
         .text(item.size, 350, rowY)
         .text("1", 400, rowY)
         .text(`INR ${item.price.toFixed(2)}`, 450, rowY, { align: "right" });
      rowY += 20;
    });

    doc.strokeColor("#E0E0E0")
       .moveTo(50, rowY + 6)
       .lineTo(545, rowY + 6)
       .stroke();

    // Total Amount Box
    doc.rect(333, rowY + 14, 212, 32)
       .fillColor("#F9F9F9")
       .fill()
       .strokeColor("#E0E0E0")
       .stroke();

    doc.fillColor("#E7396A")
       .fontSize(11)
       .font("Helvetica-Bold")
       .text("Total Paid:", 345, rowY + 24)
       .text(`INR ${transaction.amount.toFixed(2)}`, 440, rowY + 24, { align: "right", width: 95 });

    // Footer note
    doc.fontSize(8)
       .font("Helvetica-Oblique")
       .fillColor("#999999")
       .text("This is a computer generated invoice and does not require a physical signature.", 50, 780, { align: "center", width: 495 });

    doc.end();
  } catch (error) {
    console.error("Receipt generation error:", error);
    res.status(500).json({ message: "Error generating receipt" });
  }
});

// 4. POST /transaction/webhook - Idempotent payment gateway webhook endpoint
router.post("/webhook", async (req, res) => {
  const { idempotencyKey, transactionId, amount, status, paymentMethod, userId, orderId } = req.body;

  if (!idempotencyKey || !transactionId) {
    return res.status(400).json({ message: "idempotencyKey and transactionId are required" });
  }

  try {
    // Check if webhook has already been processed using idempotencyKey (Idempotency safety)
    const existingTransaction = await Transaction.findOne({ idempotencyKey });
    if (existingTransaction) {
      return res.status(200).json({
        message: "Webhook already processed (Idempotent response)",
        transaction: existingTransaction,
      });
    }

    // Check if transaction was pre-created, otherwise create it
    let transaction = await Transaction.findOne({ transactionId });
    let action = "created";

    if (transaction) {
      // Transaction pre-exists (e.g. from checkout initiation), we update details
      transaction.status = status || transaction.status;
      transaction.paymentMethod = paymentMethod || transaction.paymentMethod;
      transaction.idempotencyKey = idempotencyKey;
      await transaction.save();
      action = status || "updated";
    } else {
      // Direct webhook creation
      transaction = new Transaction({
        userId,
        orderId: orderId || null,
        transactionId,
        amount,
        status: status || "success",
        paymentMethod: paymentMethod || "card",
        idempotencyKey,
      });
      await transaction.save();
    }

    // Write to immutable / append-only Audit Log
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    await AuditLog.create({
      transactionId: transaction._id,
      action: action === "success" ? "success" : action === "failed" ? "failed" : "created",
      details: {
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        idempotencyKey,
      },
      actor: "system",
      ipAddress: clientIp,
    });

    return res.status(200).json({
      message: "Webhook processed successfully",
      transaction,
    });
  } catch (error) {
    // Handle database unique index constraint errors gracefully
    if (error.code === 11000) {
      const retryTransaction = await Transaction.findOne({ idempotencyKey });
      if (retryTransaction) {
        return res.status(200).json({
          message: "Duplicate callback caught by unique constraints (Idempotent response)",
          transaction: retryTransaction,
        });
      }
    }
    console.error("Webhook processing error:", error);
    return res.status(500).json({ message: "Webhook execution failed" });
  }
});

module.exports = router;
