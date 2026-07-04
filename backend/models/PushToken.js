const mongoose = require("mongoose");

const PushTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    deviceType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PushToken", PushTokenSchema);
