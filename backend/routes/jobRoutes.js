const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const Job = require("../models/Job");
const User = require("../models/User");
const auth = require("../middleware/auth");
const sendInterviewEmail = require("../utils/sendInterviewEmail");
const sendEmployerNotificationEmail = require("../utils/sendEmployerNotificationEmail");

// ------------------------
// POST JOB
// ------------------------
router.post("/postJob", auth, async (req, res) => {
    try {
        const { title, description, company, payRate, startDate } = req.body;

        const existingJob = await Job.findOne({ title, company });
        if (existingJob) return res.status(400).json({ message: "Job already exists" });

        const job = new Job({
            title, description, company, payRate,
            startDate: startDate ? new Date(startDate) : undefined,
            createdBy: req.user.id,
        });

        await job.save();
        res.json({ message: "Job successfully added", job });
    } catch (err) {
        console.error("POST JOB ERROR:", err);
        res.status(500).json(err);
    }
});

// ------------------------
// DELETE JOB
// ------------------------
router.delete("/deleteJob/:id", auth, async (req, res) => {
    try {
        const existingJob = await Job.findOne({ _id: req.params.id, createdBy: req.user.id });
        if (!existingJob) return res.status(400).json({ message: "Job or permission not found" });

        await Job.findByIdAndDelete(req.params.id);
        res.json({ message: "Job successfully deleted" });
    } catch (err) {
        console.error("DELETE JOB ERROR:", err);
        res.status(500).json(err);
    }
});

// ------------------------
// SEARCH JOBS (active listings only)
// ------------------------
router.post("/searchJobs", auth, async (req, res) => {
    try {
        const { title, description, company } = req.body;

        const filter = {
            title: { $regex: title, $options: "i" },
            description: { $regex: description, $options: "i" },
            company: { $regex: company, $options: "i" },
            closed: { $ne: true }, // exclude closed listings from search
        };

        const jobs = await Job.find(filter).populate("createdBy", "firstname lastname email");
        res.json(jobs);
    } catch (err) {
        console.error("SEARCH JOBS ERROR:", err);
        res.status(500).json(err);
    }
});

// ------------------------
// GET MY LISTINGS (employer — active + closed, split by closed flag)
// GET /api/jobs/myListings
// ------------------------
router.get("/myListings", auth, async (req, res) => {
    try {
        const jobs = await Job.find({ createdBy: req.user.id });
        const active = jobs.filter(j => !j.closed);
        const past = jobs.filter(j => j.closed);
        res.json({ active, past });
    } catch (err) {
        console.error("MY LISTINGS ERROR:", err);
        res.status(500).json(err);
    }
});

// ------------------------
// UPDATE JOB LISTING
// ------------------------
router.put("/updateJob/:id", auth, async (req, res) => {
    try {
        const existingJob = await Job.findOne({ _id: req.params.id, createdBy: req.user.id });
        if (!existingJob) return res.status(400).json({ message: "Job or permission not found" });

        const { title, description, company, payRate, startDate } = req.body;
        if (title !== undefined)       existingJob.title = title;
        if (description !== undefined) existingJob.description = description;
        if (company !== undefined)     existingJob.company = company;
        if (payRate !== undefined)     existingJob.payRate = payRate;
        if (startDate !== undefined)   existingJob.startDate = startDate ? new Date(startDate) : undefined;

        await existingJob.save();
        res.json({ message: "Job successfully updated", job: existingJob });
    } catch (err) {
        console.error("UPDATE JOB ERROR:", err);
        res.status(500).json(err);
    }
});

// ------------------------
// GET FULL APPLICANTS FOR A JOB
// GET /api/jobs/getApplicants/:jobId
// ------------------------
router.get("/getApplicants/:jobId", auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId).populate("applicants.user");
        if (!job) return res.status(404).json({ message: "Job not found" });

        if (job.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const applicants = job.applicants.map(a => {
            const u = a.user;
            return {
                _id: a._id,
                userId: u._id,
                firstname: u.firstname,
                lastname: u.lastname,
                email: u.email,
                phone: u.phone,
                skills: u.skills || [],
                degrees: u.degrees || [],
                experience: u.experience || [],
                resumeUrl: u.resumeUrl || null,
                appliedAt: a.appliedAt,
                status: a.status,
            };
        });

        res.json({ jobId: job._id, title: job.title, applicants });
    } catch (err) {
        console.error("GET APPLICANTS ERROR:", err);
        res.status(500).json(err);
    }
});

// ------------------------
// UPDATE APPLICANT STATUS (manual — under review / rejected)
// PUT /api/jobs/updateApplicantStatus/:jobId/:applicantSubdocId
// ------------------------
router.put("/updateApplicantStatus/:jobId/:applicantSubdocId", auth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!["pending", "rejected", "under review"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (job.createdBy.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

        const applicant = job.applicants.id(req.params.applicantSubdocId);
        if (!applicant) return res.status(404).json({ message: "Applicant not found" });

        applicant.status = status;
        await job.save();
        res.json({ message: "Applicant status updated", applicant });
    } catch (err) {
        console.error("UPDATE APPLICANT STATUS ERROR:", err);
        res.status(500).json(err);
    }
});

// ------------------------
// REQUEST INTERVIEW
// Sends email to applicant with accept/reject links
// POST /api/jobs/requestInterview/:jobId/:applicantSubdocId
// ------------------------
router.post("/requestInterview/:jobId/:applicantSubdocId", auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId).populate("applicants.user");
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (job.createdBy.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

        const applicantDoc = job.applicants.id(req.params.applicantSubdocId);
        if (!applicantDoc) return res.status(404).json({ message: "Applicant not found" });

        // Generate a unique one-time token
        const token = crypto.randomBytes(32).toString("hex");
        applicantDoc.interviewToken = token;
        applicantDoc.status = "under review"; // stays under review until they respond
        await job.save();

        // Get applicant's user info for the email
        const applicantUser = applicantDoc.user;

        await sendInterviewEmail(
            applicantUser.email,
            applicantUser.firstname,
            job.title,
            job.company,
            token
        );

        res.json({ message: "Interview request sent" });
    } catch (err) {
        console.error("REQUEST INTERVIEW ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ------------------------
// APPLICANT RESPONDS TO INTERVIEW (via email link — no auth, token-based)
// GET /api/jobs/interview/respond?token=xxx&response=accept|reject
// ------------------------
router.get("/interview/respond", async (req, res) => {
    try {
        const { token, response } = req.query;

        if (!token || !["accept", "reject"].includes(response)) {
            return res.status(400).send("Invalid request.");
        }

        // Find the job + applicant subdoc that has this token
        const job = await Job.findOne({ "applicants.interviewToken": token })
            .populate("createdBy", "firstname email")
            .populate("applicants.user", "firstname lastname email");

        if (!job) {
            return res.status(404).send("This link has already been used or is invalid.");
        }

        const applicantDoc = job.applicants.find(a => a.interviewToken === token);
        if (!applicantDoc) {
            return res.status(404).send("Applicant not found.");
        }

        const applicantUser = applicantDoc.user;
        const employer = job.createdBy;

        if (response === "accept") {
            applicantDoc.status = "interview pending";
        } else {
            applicantDoc.status = "rejected";
        }

        // Burn the token so the link can't be reused
        applicantDoc.interviewToken = null;
        await job.save();

        // Email the employer
        await sendEmployerNotificationEmail(
            employer.email,
            employer.firstname,
            `${applicantUser.firstname} ${applicantUser.lastname}`,
            applicantUser.email,
            job.title,
            response
        );

        // Return a friendly HTML page to the applicant
        const message = response === "accept"
            ? `<h2 style="color:#2e7d32">✅ Interview Accepted!</h2><p>You have accepted the interview for <strong>${job.title}</strong> at <strong>${job.company}</strong>. The employer has been notified.</p>`
            : `<h2 style="color:#c62828">❌ Interview Declined</h2><p>You have declined the interview for <strong>${job.title}</strong> at <strong>${job.company}</strong>.</p>`;

        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Ascent — Interview Response</title></head>
            <body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f5f5;">
                <div style="background:white;padding:3rem;border-radius:16px;text-align:center;max-width:480px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                    <h1 style="color:#321e5a;letter-spacing:0.3em;">ASCENT</h1>
                    ${message}
                    <p style="color:#aaa;font-size:0.85rem;margin-top:2rem;">You may close this window.</p>
                </div>
            </body>
            </html>
        `);
    } catch (err) {
        console.error("INTERVIEW RESPOND ERROR:", err);
        res.status(500).send("An error occurred. Please try again.");
    }
});

// ------------------------
// HIRE APPLICANT + CLOSE LISTING
// PUT /api/jobs/hire/:jobId/:applicantSubdocId
// ------------------------
router.put("/hire/:jobId/:applicantSubdocId", auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId).populate("applicants.user");
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (job.createdBy.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

        const applicantDoc = job.applicants.id(req.params.applicantSubdocId);
        if (!applicantDoc) return res.status(404).json({ message: "Applicant not found" });

        const hiredUser = applicantDoc.user;

        // Mark hired applicant's status
        applicantDoc.status = "hired";

        // Reject everyone else
        job.applicants.forEach(a => {
            if (a._id.toString() !== req.params.applicantSubdocId && a.status !== "hired") {
                a.status = "rejected";
            }
        });

        // Close the listing and record who was hired
        job.closed = true;
        job.hiredApplicant = {
            userId: hiredUser._id,
            firstname: hiredUser.firstname,
            lastname: hiredUser.lastname,
            email: hiredUser.email,
        };

        await job.save();

        res.json({ message: "Applicant hired and listing closed", job });
    } catch (err) {
        console.error("HIRE ERROR:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
