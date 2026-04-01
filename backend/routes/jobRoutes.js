const express = require("express");
const router = express.Router();


const Job = require("../models/Job");

const auth = require("../middleware/auth");

// ------------------------
// POST JOB
// ------------------------
router.post("/postJob", auth, async (req, res) => {
    try {
        const { title, description, company } = req.body;

        // Check for existing job
        const existingJob = await Job.findOne({ title, company });
        if (existingJob) return res.status(400).json({ message: "Job already exists" });

        const createdBy = req.user.id;

        const job = new Job({
            title,
            description,
            company,
            createdBy,
        });

        await job.save();

        res.json({ message: "Job successfully added" });
    }
    catch (err) {
        console.error("POST JOB ERROR:", err);
        res.status(500).json(err);
    }
});

// ------------------------
// DELETE JOB
// ------------------------
router.delete("/deleteJob/:id", auth, async (req, res) => {
    try {
        const jobId = req.params.id;
        const createdBy = req.user.id;

        // Check if job exists and was created by user
        const existingJob = await Job.findOne({ _id: jobId, createdBy });
        if (!existingJob) return res.status(400).json({ message: "Job or permission not found" });

        await Job.findByIdAndDelete(jobId);

        res.json({ message: "Job successfully deleted" });
    }
    catch (err) {
        console.error("DELETE JOB ERROR:", err);
        res.status(500).json(err);
    }
});

module.exports = router;