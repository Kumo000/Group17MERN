const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const User = require("../models/User");
const Job = require("../models/Job");
const sendVerificationEmail = require("../utils/sendEmail");
const auth = require("../middleware/auth");

// ------------------------
// MULTER SETUP FOR RESUME UPLOADS
// ------------------------
const uploadDir = path.join(__dirname, "../uploads/resumes");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${req.user.id}_${Date.now()}${ext}`);
    },
});

const fileFilter = (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ------------------------
// REGISTER
// ------------------------
router.post("/register", async (req, res) => {
    try {
        const { firstname, lastname, email, phone, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString("hex");

        const user = new User({ firstname, lastname, email, phone, password: hashedPassword, role, verificationToken });
        await user.save();
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

        const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET, { expiresIn: "7d" });
        const { password: _, verificationToken, ...userData } = user._doc;
        res.json({ message: "Login success", token, user: userData });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json(err);
    }
});

// ------------------------
// GET CURRENT USER
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
// ------------------------
router.put("/update", auth, async (req, res) => {
    try {
        const updates = {};
        const allowedFields = ["firstname", "lastname", "email", "phone", "role", "degrees", "skills", "experience", "password"];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);

        const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
            .select("-password -verificationToken");

        res.json({ message: "Profile updated", user: updatedUser });
    } catch (err) {
        console.error("UPDATE ERROR:", err);
        res.status(500).json(err);
    }
});

// ------------------------
// UPLOAD RESUME (PDF)
// POST /api/users/upload-resume
// ------------------------
router.post("/upload-resume", auth, upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded or file is not a PDF" });

        const resumeUrl = `/uploads/resumes/${req.file.filename}`;
        const updatedUser = await User.findByIdAndUpdate(req.user.id, { resumeUrl }, { new: true })
            .select("-password -verificationToken");

        res.json({ message: "Resume uploaded successfully", resumeUrl, user: updatedUser });
    } catch (err) {
        console.error("UPLOAD RESUME ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ------------------------
// APPLY TO JOB
// POST /api/users/jobs/apply/:jobId
// ------------------------
router.post("/jobs/apply/:jobId", auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (job.closed) return res.status(400).json({ message: "This listing is no longer accepting applications" });

        const alreadyApplied = job.applicants.some(a => a.user.toString() === req.user.id);
        if (alreadyApplied) return res.status(400).json({ message: "Already applied to this job" });

        job.applicants.push({ user: req.user.id });
        await job.save();
        res.json({ message: "Applied successfully" });
    } catch (err) {
        console.error("APPLY ERROR:", err);
        res.status(500).json(err);
    }
});

// ------------------------
// GET MY APPLICATIONS
// GET /api/users/jobs/my-applications
// Returns all jobs the user has applied to with their current status
// ------------------------
router.get("/jobs/my-applications", auth, async (req, res) => {
    try {
        const jobs = await Job.find({ "applicants.user": req.user.id });

        const mappedJobs = jobs.map((job) => {
            const app = job.applicants.find(a => a.user.toString() === req.user.id);
            return {
                _id: job._id,
                title: job.title,
                company: job.company,
                appliedAt: app?.appliedAt,
                // Pass through all possible statuses including interview pending / hired
                status: app?.status || "pending",
            };
        });

        res.json(mappedJobs);
    } catch (err) {
        console.error("GET APPLICATIONS ERROR:", err);
        res.status(500).json(err);
    }
});

module.exports = router;
