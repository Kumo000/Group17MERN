const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    company: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    creationDate: { type: Date, default: Date.now },

    applicants: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            appliedAt: { type: Date, default: Date.now },
            status: {
                type: String,
                enum: ["pending", "rejected", "under review"],
                default: "pending",
            },
        },
    ],
});

module.exports = mongoose.model("Job", jobSchema);
