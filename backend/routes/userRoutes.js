const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Job = require("../models/Job");
const sendVerificationEmail = require("../utils/sendEmail");
const auth = require("../middleware/auth"); // your existing JWT middleware

// ------------------------
// REGISTER
// ------------------------
router.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, email, phone, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = new User({
      firstname,
      lastname,
      email,
      phone,
      password: hashedPassword,
      role,
      verificationToken,
    });

    await user.save();

    // Send verification email (async)
    sendVerificationEmail(email, verificationToken);

    res.json({ message: "Check your email to verify your account" });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json(err);
  }
});

// ------------------------
// VERIFY EMAIL
// ------------------------
router.get("/verify", async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: "Invalid token" });

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ message: "Email verified!" });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json(err);
  }
});

// ------------------------
// LOGIN
// ------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) return res.status(400).json({ message: "Verify your email first" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT
    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Exclude sensitive fields
    const { password: _, verificationToken, ...userData } = user._doc;

    res.json({ message: "Login success", token, user: userData });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json(err);
  }
});

// ------------------------
// GET CURRENT USER
// Protected route
// ------------------------
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -verificationToken");
    res.json(user);
  } catch (err) {
    console.error("GET USER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// UPDATE USER INFO
// Protected route
// ------------------------
router.put("/update", auth, async (req, res) => {
  try {
    const updates = {};
    const allowedFields = [
      "firstname",
      "lastname",
      "email",
      "phone",
      "role",
      "degrees",
      "skills",
      "experience",
      "password"
    ];

    // Only update allowed fields if they exist in request body
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Hash password if it's being updated
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select("-password -verificationToken");

    res.json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json(err);
  }
});

// ------------------------
// APPLY TO JOB
// Protected route
// ------------------------
router.post("/jobs/apply/:jobId", auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Prevent duplicate applications
    const alreadyApplied = job.applicants.some(
      (app) => app.user.toString() === req.user.id
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: "Already applied to this job" });
    }

    // Add applicant
    job.applicants.push({
      user: req.user.id,
    });

    await job.save();

    res.json({ message: "Applied successfully" });
  } catch (err) {
    console.error("APPLY ERROR:", err);
    res.status(500).json(err);
  }
});

// ------------------------
// GET MY APPLICATIONS
// Protected route
// ------------------------
router.get("/jobs/my-applications", auth, async (req, res) => {
  try {
    const jobs = await Job.find({ "applicants.user": req.user.id }).populate(
      "createdBy",
      "firstname lastname email"
    );

    // Map to include only the logged-in user's application data
    const mappedJobs = jobs.map((job) => {
      const app = job.applicants.find(
        (a) => a.user.toString() === req.user.id
      );

      return {
        _id: job._id,
        title: job.title,
        company: job.company,
        appliedAt: app?.appliedAt,
        status: app?.status || "pending",
      };
    });

    res.json(mappedJobs);
  } catch (err) {
    console.error("GET APPLICATIONS ERROR:", err);
    res.status(500).json(err);
  }
});

// ------------------------
// UPDATE APPLICATION STATUS
// Protected route (employer only)
// ------------------------
router.put("/jobs/:jobId/applicants/:userId/status", auth, async (req, res) => {
  try {
    const { jobId, userId } = req.params;
    const { status } = req.body;

    if (!["pending", "rejected", "under review"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Optional: Only allow the creator of the job to update
    if (job.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const applicant = job.applicants.find(
      (a) => a.user.toString() === userId
    );
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    applicant.status = status;
    await job.save();

    res.json({ message: "Application status updated", applicant });
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json(err);
  }
});

// ------------------------
// CREATE JOB
// Protected route: Employers only
// ------------------------
router.post("/jobs/create", auth, async (req, res) => {
  try {
    const { title, description, company } = req.body;

    if (!title || !description || !company) {
      return res.status(400).json({ message: "Title, description, and company are required" });
    }

    // Ensure the user is an Employer
    if (req.user.role !== "Employer") {
      return res.status(403).json({ message: "Only employers can create jobs" });
    }

    const newJob = new Job({
      title,
      description,
      company,
      createdBy: req.user.id,
      applicants: [], // empty initially
      status: "pending", // default job status
    });

    await newJob.save();

    res.status(201).json({ message: "Job created successfully", job: newJob });
  } catch (err) {
    console.error("CREATE JOB ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
