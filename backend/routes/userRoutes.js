const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const sendVerificationEmail = require("../utils/sendEmail");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString("hex");

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      verificationToken: token,
    });

    await user.save();

    await sendVerificationEmail(email, token);

    res.json({ message: "Check your email to verify your account" });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json(err);
  }
});

// VERIFY
router.get("/verify", async (req, res) => {
  const { token } = req.query;

  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    return res.status(400).json({ message: "Invalid token" });
  }

  user.isVerified = true;
  user.verificationToken = null;

  await user.save();

  res.json({ message: "Email verified!" });
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  if (!user.isVerified) {
    return res.status(400).json({ message: "Verify your email first" });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  res.json({ message: "Login success", user });
});

module.exports = router;
