const express = require("express");
const request = require("supertest");
const Job = require("../models/Job");
const User = require("../models/User");

const router = require("../routes/jobRoutes");

const app = express();
app.use(express.json());

// Mocking the auth middleware to simulate a logged in employer
jest.mock("../middleware/auth", () => (req, res, next) => {
    req.user = { id: "employer123" };
    next();
});

app.use("/jobs", router);

jest.mock("../models/Job");
jest.mock("../models/User");

describe("Job Routes - Full Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Silence console.error during expected failure tests so the terminal stays clean
        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    // ----------------------------------------------------
    // POST JOB
    // ----------------------------------------------------
    describe("POST /jobs/postJob", () => {
        test("should return 400 if job already exists", async () => {
            Job.findOne.mockResolvedValue({ title: "Dev", company: "Tech" });

            const response = await request(app).post("/jobs/postJob").send({
                title: "Dev", company: "Tech"
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Job already exists");
        });

        test("should create a new job and return 200", async () => {
            Job.findOne.mockResolvedValue(null);
            Job.prototype.save = jest.fn().mockResolvedValue(true);

            const response = await request(app).post("/jobs/postJob").send({
                title: "Dev", company: "Tech", payRate: 100, startDate: "2024-01-01"
            });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Job successfully added");
        });
    });

    // ----------------------------------------------------
    // DELETE JOB
    // ----------------------------------------------------
    describe("DELETE /jobs/deleteJob/:id", () => {
        test("should return 400 if user does not own job", async () => {
            Job.findOne.mockResolvedValue(null);

            const response = await request(app).delete("/jobs/deleteJob/job123");
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Job or permission not found");
        });

        test("should delete job and return 200", async () => {
            Job.findOne.mockResolvedValue({ _id: "job123", createdBy: "employer123" });
            Job.findByIdAndDelete.mockResolvedValue(true);

            const response = await request(app).delete("/jobs/deleteJob/job123");
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Job successfully deleted");
        });
    });

    // ----------------------------------------------------
    // SEARCH JOBS
    // ----------------------------------------------------
    describe("POST /jobs/searchJobs", () => {
        test("should return filtered jobs", async () => {
            const mockJobs = [{ title: "Dev" }];
            // Chain mock for populate
            Job.find.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockJobs) });

            const response = await request(app).post("/jobs/searchJobs").send({
                title: "Dev", description: "", company: ""
            });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockJobs);
        });
    });

    // ----------------------------------------------------
    // GET MY LISTINGS
    // ----------------------------------------------------
    describe("GET /jobs/myListings", () => {
        test("should separate active and past jobs", async () => {
            const mockJobs = [
                { _id: "1", title: "Active Job", closed: false },
                { _id: "2", title: "Old Job", closed: true }
            ];
            Job.find.mockResolvedValue(mockJobs);

            const response = await request(app).get("/jobs/myListings");

            expect(response.status).toBe(200);
            expect(response.body.active.length).toBe(1);
            expect(response.body.past.length).toBe(1);
            expect(response.body.active[0].title).toBe("Active Job");
        });
    });

    // ----------------------------------------------------
    // UPDATE JOB
    // ----------------------------------------------------
    describe("PUT /jobs/updateJob/:id", () => {
        test("should update specific fields of a job", async () => {
            const mockJob = { _id: "job1", title: "Old Title", save: jest.fn().mockResolvedValue(true) };
            Job.findOne.mockResolvedValue(mockJob);

            const response = await request(app).put("/jobs/updateJob/job1").send({
                title: "New Title"
            });

            expect(response.status).toBe(200);
            expect(mockJob.title).toBe("New Title");
            expect(mockJob.save).toHaveBeenCalled();
        });
    });

    // ----------------------------------------------------
    // GET APPLICANTS
    // ----------------------------------------------------
    describe("GET /jobs/getApplicants/:jobId", () => {
        test("should return 403 if user is not creator", async () => {
            const mockJob = { _id: "job1", createdBy: "differentUser" };
            Job.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockJob) });

            const response = await request(app).get("/jobs/getApplicants/job1");
            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Unauthorized");
        });

        test("should return formatted applicants if user is creator", async () => {
            const mockJob = {
                _id: "job1", title: "Dev", createdBy: "employer123",
                applicants: [{
                    _id: "app1", appliedAt: "2024-01-01", status: "pending",
                    user: { _id: "user1", firstname: "John", lastname: "Doe", email: "test@test.com" }
                }]
            };
            Job.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockJob) });

            const response = await request(app).get("/jobs/getApplicants/job1");
            expect(response.status).toBe(200);
            expect(response.body.applicants[0].firstname).toBe("John");
        });
    });

    // ----------------------------------------------------
    // UPDATE APPLICANT STATUS / REQUEST INTERVIEW
    // ----------------------------------------------------
    describe("Applicant Status Routes", () => {
        const mockJob = {
            _id: "job1",
            createdBy: "employer123",
            applicants: { id: jest.fn().mockReturnValue({ status: "pending" }) },
            save: jest.fn().mockResolvedValue(true)
        };

        beforeEach(() => {
            Job.findById.mockResolvedValue(mockJob);
        });

        test("PUT updateApplicantStatus - should reject invalid status", async () => {
            const response = await request(app).put("/jobs/updateApplicantStatus/job1/app1").send({ status: "hired" });
            expect(response.status).toBe(400); // Only pending, rejected, under review are allowed in this specific route
        });

        test("PUT updateApplicantStatus - should update valid status", async () => {
            const response = await request(app).put("/jobs/updateApplicantStatus/job1/app1").send({ status: "rejected" });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Applicant status updated");
            expect(mockJob.save).toHaveBeenCalled();
        });

        test("POST requestInterview - should set status to 'interview requested'", async () => {
            const response = await request(app).post("/jobs/requestInterview/job1/app1");
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Interview requested");
        });
    });

    // ----------------------------------------------------
    // CLOSE / HIRE LISTING
    // ----------------------------------------------------
    describe("PUT /jobs/closeJob/:id", () => {
        test("should mark job as closed", async () => {
            const mockJob = { _id: "job1", closed: false, save: jest.fn().mockResolvedValue(true) };
            Job.findOne.mockResolvedValue(mockJob);

            const response = await request(app).put("/jobs/closeJob/job1");
            expect(response.status).toBe(200);
            expect(mockJob.closed).toBe(true);
        });
    });

    describe("PUT /jobs/hire/:jobId/:applicantSubdocId", () => {
        test("should hire applicant and close listing", async () => {
            const mockApplicant = {
                user: { _id: "user1", firstname: "John", lastname: "Doe", email: "john@test.com" },
                status: "pending"
            };
            const mockJob = {
                _id: "job1",
                createdBy: "employer123",
                closed: false,
                applicants: { id: jest.fn().mockReturnValue(mockApplicant) },
                save: jest.fn().mockResolvedValue(true)
            };

            Job.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockJob) });

            const response = await request(app).put("/jobs/hire/job1/app1");

            expect(response.status).toBe(200);
            expect(mockJob.closed).toBe(true);
            expect(mockJob.hiredApplicant.firstname).toBe("John");
            expect(mockApplicant.status).toBe("hired");
            expect(mockJob.save).toHaveBeenCalled();
        });
    });
});