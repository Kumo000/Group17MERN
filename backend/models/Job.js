const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    company: String,
    payRate: { type: String },
    startDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Whether this listing has been closed (hire made)
    closed: { type: Boolean, default: false },

    // Who was hired (populated on hire)
    hiredApplicant: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        firstname: String,
        lastname: String,
        email: String,
    },

    applicants: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            appliedAt: { type: Date, default: Date.now },
            status: {
                type: String,
                enum: ["pending", "rejected", "under review", "interview requested", "interview pending", "hired"],
                default: "pending",
            },

        },
    ],
}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);
