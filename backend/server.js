require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path"); // already imported most likely

const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");

const app = express();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json());

app.use(cors({
  origin: ['http://localhost:5173', 'http://143.198.6.35', 'http://miniapp4331.com'], // React frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: false, // if using cookies or sessions
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('/api/users/login', (req, res) => {
  console.log('OPTIONS preflight for login received');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.sendStatus(200);
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);

// Debug preflight requests
app.options(/.*/, (req, res) => {
  console.log('OPTIONS preflight received:', req.path);
  res.sendStatus(200);
});


// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.listen(5001, "0.0.0.0", () => {
  console.log("Server running on port 5001");
});
