const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;

  // Server-side validation
  if (!fullName || !fullName.trim()) return res.status(400).json({ message: "Full name is required" });
  if (!email || !email.trim()) return res.status(400).json({ message: "Email is required" });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return res.status(400).json({ message: "Invalid email format" });
  if (!password || password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });

  try {
    const existinguser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existinguser)
      return res.status(409).json({ message: "An account with this email already exists" });
    const hashedpassword = await bcrypt.hash(password, 10);
    const user = new User({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedpassword,
    });
    await user.save();
    const { password: _, ...userData } = user.toObject();
    res.status(201).json({ user: userData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Server-side validation
  if (!email || !email.trim()) return res.status(400).json({ message: "Email is required" });
  if (!password) return res.status(400).json({ message: "Password is required" });

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: "No account found with this email" });
    const ismatch = await bcrypt.compare(password, user.password);
    if (!ismatch) return res.status(401).json({ message: "Incorrect password" });

    const { password: _, ...userData } = user.toObject();
    res.status(200).json({ user: userData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});
module.exports=router;