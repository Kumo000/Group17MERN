// Set dummy environment variables
process.env.SENDGRID_API_KEY = "SG.dummy_key";
process.env.JWT_SECRET = "test_secret_123";

const express = require("express");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Job = require("../models/Job");
const { sendVerificationEmail, sendResetPasswordEmail } = require("../utils/sendEmail");

const router = require("../routes/userRoutes");

const app = express();
app.use(express.json());

// Mocking the auth middleware to simulate a logged in applicant
jest.mock("../middleware/auth", () => (req, res, next) => {
    req.user = { id: "user123" };
    next();
});

app.use("/", router);

jest.mock("../models/User");
jest.mock("../models/Job");
jest.mock("bcryptjs");
jest.mock("../utils/sendEmail", () => ({
    sendVerificationEmail: jest.fn(),
    sendResetPasswordEmail: jest.fn()
}));

// Mock minimal Multer behavior for the upload-resume route
jest.mock("multer", () => {
    const multer = () => ({
        single: () => (req, res, next) => {
            req.file = { filename: "test_resume.pdf", mimetype: "application/pdf" };
            next();
        }
    });
    multer.diskStorage = jest.fn();
    return multer;
});


describe("User Routes - Full Integration Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ----------------------------------------------------
    // 1. REGISTER & VERIFY
    // ----------------------------------------------------
    describe("POST /register", () => {
        test("should return 400 if user exists", async () => {
            User.findOne.mockResolvedValue({ email: "test@test.com" });
            const response = await request(app).post("/register").send({ email: "test@test.com", password: "123" });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("User already exists");
        });

        test("should return 200 and send email on success", async () => {
            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue("hashed_pass");
            User.prototype.save = jest.fn().mockResolvedValue(true);

            const response = await request(app)
                .post("/register")
                .send({ firstname: "John", email: "new@test.com", password: "password123" });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Check your email to verify your account");
            expect(sendVerificationEmail).toHaveBeenCalled();
        });
    });

    describe("GET /verify", () => {
        test("should return 400 for invalid token", async () => {
            User.findOne.mockResolvedValue(null);
            const response = await request(app).get("/verify?token=bad-token");
            expect(response.status).toBe(400);
        });

        test("should return 200 and verify user", async () => {
            const mockUser = { save: jest.fn().mockResolvedValue(true), isVerified: false };
            User.findOne.mockResolvedValue(mockUser);

            const response = await request(app).get("/verify?token=good-token");
            expect(response.status).toBe(200);
            expect(mockUser.save).toHaveBeenCalled();
            expect(mockUser.isVerified).toBe(true);
        });
    });

    // ----------------------------------------------------
    // 2. LOGIN
    // ----------------------------------------------------
    describe("POST /login", () => {
        test("should return 400 if user is not verified", async () => {
            User.findOne.mockResolvedValue({ email: "test@test.com", isVerified: false });
            const response = await request(app).post("/login").send({ email: "test@test.com", password: "123" });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Verify your email first");
        });

        test("should return 200, JWT, and user data on success", async () => {
            const mockUser = {
                _id: "user123", email: "test@test.com", isVerified: true, password: "hash",
                _doc: { _id: "user123", email: "test@test.com" }
            };
            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);

            const response = await request(app).post("/login").send({ email: "test@test.com", password: "123" });
            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
        });
    });

    // ----------------------------------------------------
    // 3. PROFILE OPERATIONS (Protected Routes)
    // ----------------------------------------------------
    describe("GET /me", () => {
        test("should return user profile data", async () => {
            const mockUser = { _id: "user123", firstname: "John" };
            // Chain mock for .select()
            User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

            const response = await request(app).get("/me");
            expect(response.status).toBe(200);
            expect(response.body.firstname).toBe("John");
        });
    });

    describe("PUT /update", () => {
        test("should update allowed fields", async () => {
            const mockUpdatedUser = { _id: "user123", firstname: "NewName" };
            User.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUpdatedUser) });

            const response = await request(app).put("/update").send({ firstname: "NewName" });
            expect(response.status).toBe(200);
            expect(response.body.user.firstname).toBe("NewName");
        });
    });

    describe("POST /upload-resume", () => {
        test("should return 200 and save resume URL", async () => {
            const mockUpdatedUser = { _id: "user123", resumeUrl: "/uploads/resumes/test_resume.pdf" };
            User.findByIdAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUpdatedUser) });

            // Multer is mocked above to always attach req.file
            const response = await request(app).post("/upload-resume");
            expect(response.status).toBe(200);
            expect(response.body.resumeUrl).toContain("test_resume.pdf");
        });
    });

    // ----------------------------------------------------
    // 4. JOB APPLICATIONS (Protected Routes)
    // ----------------------------------------------------
    describe("POST /jobs/apply/:jobId", () => {
        test("should apply to job successfully", async () => {
            const mockJob = { _id: "job1", closed: false, applicants: [], save: jest.fn().mockResolvedValue(true) };
            Job.findById.mockResolvedValue(mockJob);

            const response = await request(app).post("/jobs/apply/job1");
            expect(response.status).toBe(200);
            expect(mockJob.applicants.length).toBe(1);
        });

        test("should return 400 if already applied", async () => {
            const mockJob = { _id: "job1", closed: false, applicants: [{ user: "user123" }] };
            Job.findById.mockResolvedValue(mockJob);

            const response = await request(app).post("/jobs/apply/job1");
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Already applied to this job");
        });
    });

    describe("GET /jobs/my-applications", () => {
        test("should return users applied jobs", async () => {
            const mockJobs = [{
                _id: "job1", title: "Dev", company: "Tech",
                applicants: [{ user: "user123", status: "pending" }]
            }];
            Job.find.mockResolvedValue(mockJobs);

            const response = await request(app).get("/jobs/my-applications");
            expect(response.status).toBe(200);
            expect(response.body[0].status).toBe("pending");
            expect(response.body[0].title).toBe("Dev");
        });
    });

    // ----------------------------------------------------
    // 5. PASSWORD RECOVERY
    // ----------------------------------------------------
    describe("POST /forgot-password", () => {
        test("should send recovery email if user exists", async () => {
            const mockUser = { email: "test@test.com", save: jest.fn().mockResolvedValue(true) };
            User.findOne.mockResolvedValue(mockUser);

            const response = await request(app).post("/forgot-password").send({ email: "test@test.com" });
            expect(response.status).toBe(200);
            expect(sendResetPasswordEmail).toHaveBeenCalled();
            expect(mockUser.resetPasswordToken).toBeDefined();
        });

        test("should return 404 if user doesn't exist", async () => {
            User.findOne.mockResolvedValue(null);
            const response = await request(app).post("/forgot-password").send({ email: "fake@test.com" });
            expect(response.status).toBe(404);
        });
    });

    describe("POST /reset-password/:token", () => {
        test("should reset password with valid token", async () => {
            const mockUser = {
                email: "test@test.com",
                resetPasswordToken: "valid-token",
                save: jest.fn().mockResolvedValue(true)
            };
            User.findOne.mockResolvedValue(mockUser);
            bcrypt.genSalt.mockResolvedValue("salt");
            bcrypt.hash.mockResolvedValue("new_hashed_password");

            const response = await request(app)
                .post("/reset-password/valid-token")
                .send({ password: "newPassword123" });

            expect(response.status).toBe(200);
            expect(mockUser.password).toBe("new_hashed_password");
            expect(mockUser.resetPasswordToken).toBeUndefined(); // Verify token was cleared
        });
    });
});