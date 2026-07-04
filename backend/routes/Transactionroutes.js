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

  try {
    // Fetch queryLimit + 1 items to check if there is a next page
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(queryLimit + 1);

    const hasNextPage = transactions.length > queryLimit;
    const results = hasNextPage ? transactions.slice(0, queryLimit) : transactions;

    // Map receipt links dynamically
    const host = req.get("host");
    const formattedResults = results.map(t => {
      const plainObj = t.toObject();
      plainObj.receiptUrl = generateReceiptLink(host, t._id.toString());
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

// 2. GET /transaction/export/csv - Stream CSV generation for large exports
router.get("/export/csv", async (req, res) => {
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

    // Initialize beautiful PDF Document
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="receipt_${transaction.transactionId}.pdf"`);
    
    doc.pipe(res);

    // Decorative Header (Myntra Colors / Design aesthetics)
    doc.fillColor("#E7396A") // Myntra Pink
       .rect(0, 0, 612, 30) // top strip
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
       .lineTo(562, 105)
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
       .lineTo(562, 205)
       .stroke();

    // Main line items
    doc.fontSize(12)
       .font("Helvetica-Bold")
       .text("Description", 50, 225)
       .text("Amount (INR)", 450, 225, { align: "right" });

    doc.strokeColor("#999999")
       .moveTo(50, 240)
       .lineTo(562, 240)
       .stroke();

    doc.fontSize(10)
       .font("Helvetica")
       .text("Online Retail Purchase - Items shipped per Order Reference", 50, 255)
       .text(`INR ${transaction.amount.toFixed(2)}`, 450, 255, { align: "right" });

    doc.strokeColor("#E0E0E0")
       .moveTo(50, 280)
       .lineTo(562, 280)
       .stroke();

    // Total Amount Box
    doc.rect(350, 300, 212, 40)
       .fillColor("#F9F9F9")
       .fill()
       .stroke();

    doc.fillColor("#333333")
       .fontSize(12)
       .font("Helvetica-Bold")
       .text("Total Paid:", 360, 314)
       .text(`₹${transaction.amount.toFixed(2)}`, 470, 314, { align: "right" });

    // Footer note
    doc.fontSize(8)
       .font("Helvetica-Oblique")
       .fillColor("#999999")
       .text("This is a computer generated invoice and does not require a physical signature.", 50, 700, { align: "center" });

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
