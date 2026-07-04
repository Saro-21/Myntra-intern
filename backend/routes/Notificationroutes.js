const express = require("express");
const router = express.Router();
const PushToken = require("../models/PushToken");
const Notification = require("../models/Notification");
const Job = require("../models/Job");
const NotificationLog = require("../models/NotificationLog");
const Bag = require("../models/Bag");

// Background Job Worker
async function runQueueWorkerInternal() {
  const processed = [];
  const errors = [];

  try {
    const jobs = await Job.find({
      status: "pending",
      scheduledAt: { $lte: new Date() },
    });

    for (const job of jobs) {
      // 1. Check cart abandonment conditions
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

      // 2. Enforce rate limiting: max 5 notifications per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await NotificationLog.countDocuments({
        userId: job.userId,
        sentAt: { $gte: oneHourAgo },
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
          const messages = tokens.map((t) => ({
            to: t.token,
            sound: "default",
            title: job.title,
            body: job.body,
            data: job.data,
          }));

          // Expo push notifications API call
          const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Accept-Encoding": "gzip, deflate",
            },
            body: JSON.stringify(messages),
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
          // Fallback if no push tokens: succeed locally for simulated logs
          pushSucceeded = true;
        }

        // Clean up invalid/expired device tokens
        if (invalidTokens.length > 0) {
          await PushToken.deleteMany({ token: { $in: invalidTokens } });
        }

        if (pushSucceeded) {
          // Store notification in database
          await Notification.create({
            userId: job.userId,
            title: job.title,
            body: job.body,
            data: job.data,
          });

          // Log notification timestamp for rate limiting
          await NotificationLog.create({
            userId: job.userId,
            sentAt: new Date(),
          });

          job.status = "completed";
          job.lastError = null;
          await job.save();
          processed.push({
            jobId: job._id,
            status: "completed",
            removedTokens: invalidTokens.length,
          });
        } else {
          throw new Error("Push attempt did not succeed");
        }
      } catch (err) {
        // Retry logic with status reset + exponential backoff logging
        job.lastError = err.message;
        if (job.attempts >= job.maxAttempts) {
          job.status = "failed";
        } else {
          job.status = "pending";
          // Add backoff delay to scheduled time for next attempt
          const backoffDelay = Math.pow(2, job.attempts) * 30 * 1000; // 1m, 2m, etc.
          job.scheduledAt = new Date(Date.now() + backoffDelay);
        }
        await job.save();
        errors.push({ jobId: job._id, attempt: job.attempts, error: err.message });
      }
    }
  } catch (error) {
    console.error("Queue worker error:", error);
  }

  return { processed, errors };
}

// ── ROUTES ───────────────────────────────────────────────────────────────────

// POST /register
router.post("/", async (req, res) => {
  const { action } = req.query;

  if (action === "register") {
    const { userId, token, deviceType } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
    try {
      const entry = await PushToken.findOneAndUpdate(
        { token },
        { userId: userId || null, deviceType: deviceType || "web" },
        { upsert: true, new: true }
      );
      return res.status(200).json({ message: "Token registered", entry });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }

  if (action === "unregister") {
    const { token } = req.body;
    try {
      await PushToken.deleteOne({ token });
      return res.status(200).json({ message: "Token unregistered" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }

  if (action === "mark-read") {
    const { userId, notificationId, all } = req.body;
    try {
      if (all) {
        await Notification.updateMany({ userId }, { read: true });
      } else if (notificationId) {
        await Notification.findByIdAndUpdate(notificationId, { read: true });
      }
      return res.status(200).json({ message: "Marked as read" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }

  if (action === "trigger-realtime") {
    const { userId, title, body, data } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    try {
      const job = await Job.create({
        type: "REALTIME_PUSH",
        userId,
        title: title || "Real-time Order Update 📦",
        body: body || "Your Myntra order has been packed and is ready for dispatch!",
        data: data || { type: "order_update", orderId: "12345" },
        scheduledAt: new Date(),
        status: "pending",
      });

      const runResult = await runQueueWorkerInternal();
      return res.status(200).json({ message: "Real-time job triggered", job, runResult });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }

  if (action === "trigger-scheduled") {
    const { userId, title, body, data, delayMinutes } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    const delay = delayMinutes ? parseInt(delayMinutes, 10) : 2;
    try {
      const job = await Job.create({
        type: "SCHEDULED_PUSH",
        userId,
        title: title || "Special Discount Waiting! 💃",
        body: body || "Hurry! Items in your wishlist are at 40% discount for the next 1 hour.",
        data: data || { type: "wishlist_sale" },
        scheduledAt: new Date(Date.now() + delay * 60 * 1000),
        status: "pending",
      });

      return res.status(200).json({ message: "Scheduled job enqueued", job });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }

  if (action === "run-jobs") {
    try {
      const result = await runQueueWorkerInternal();
      return res.status(200).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }

  return res.status(400).json({ message: "Invalid action" });
});

// GET /?userId=xxx
router.get("/", async (req, res) => {
  const { userId, unread, action } = req.query;

  if (action === "jobs-status") {
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    try {
      const jobs = await Job.find({ userId }).sort({ createdAt: -1 }).limit(30);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const hourlyCount = await NotificationLog.countDocuments({
        userId,
        sentAt: { $gte: oneHourAgo },
      });
      return res.status(200).json({ jobs, hourlyCount });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }

  if (!userId) {
    return res.status(400).json({ message: "userId query parameter is required" });
  }

  try {
    const filter = { userId };
    if (unread === "true") {
      filter.read = false;
    }
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

// DELETE /?action=reset-jobs&userId=xxx
router.delete("/", async (req, res) => {
  const { action, userId } = req.query;
  if (action === "reset-jobs" && userId) {
    try {
      await Job.deleteMany({ userId });
      await Notification.deleteMany({ userId });
      await NotificationLog.deleteMany({ userId });
      return res.status(200).json({ message: "Test data reset successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
  return res.status(400).json({ message: "Invalid action" });
});

module.exports = {
  router,
  runQueueWorkerInternal,
};
