const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,

  role: {
    type: String,
    enum: ["Applicant", "Employer"],
  },

  phone: String,
  degrees: [String],
  skills: [String],

  isVerified: { type: Boolean, default: false },
  verificationToken: String,
});

module.exports = mongoose.model("User", userSchema);
