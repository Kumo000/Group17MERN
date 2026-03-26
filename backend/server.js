const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(express.json());

app.options('/api/users/login', (req, res) => {
  console.log('OPTIONS preflight for login received');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.sendStatus(200);
});

app.use(cors({
  origin: 'http://localhost:5173', // React frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: false, // if using cookies or sessions
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Debug preflight requests
app.options(/.*/, (req, res) => {
  console.log('OPTIONS preflight received:', req.path);
  res.sendStatus(200);
});

// Routes
app.use("/api/users", userRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.listen(5001, () => {
  console.log("Server running on http://localhost:5001");
});
