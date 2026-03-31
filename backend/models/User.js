const mongoose = require("mongoose");

// Sub-schema for experience entries
const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date }, // optional if user is still working there
  description: { type: String },
});

// Sub-schema for degrees
const degreeSchema = new mongoose.Schema({
  university: { type: String, required: true },
  degree: { type: String, required: true },
  major: { type: String }, // optional
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

  isVerified: { type: Boolean, default: false },
  verificationToken: String,
});

module.exports = mongoose.model("User", userSchema);
