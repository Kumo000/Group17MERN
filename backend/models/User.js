const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  description: { type: String },
});

const degreeSchema = new mongoose.Schema({
  university: { type: String, required: true },
  degree: { type: String, required: true },
  major: { type: String },
});

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["Applicant", "Employer"],
  },

  experience: [experienceSchema],
  degrees: [degreeSchema],
  skills: [String],

  resumeUrl: { type: String }, // path to uploaded PDF resume

  isVerified: { type: Boolean, default: false },
  verificationToken: String,

  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

module.exports = mongoose.model("User", userSchema);

