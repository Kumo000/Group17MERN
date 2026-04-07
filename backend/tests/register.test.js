// Set dummy key
process.env.SENDGRID_API_KEY = "SG.dummy_key";

const express = require("express");
const request = require("supertest");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const sendVerificationEmail = require("../utils/sendEmail");

// Import router
const router = require("../routes/userRoutes");

// Create mini-app for router
const app = express();
app.use(express.json());
app.use("/", router);

jest.mock("../models/User");
jest.mock("bcryptjs");
jest.mock("../utils/sendEmail");

describe("API Routes: /register and /verify", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /register", () => {
        test("should return 400 if user exists", async () => {
            // Database finds a user
            User.findOne.mockResolvedValue({ email: "test@test.com" });

            const response = await request(app)
                .post("/register")
                .send({ email: "test@test.com", password: "123" });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("User already exists");
        });

        test("should return 200 and send email on success", async () => {
            // User doesn't exist, bcrypt works, save works
            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue("hashed_pass");
            User.prototype.save = jest.fn().mockResolvedValue(true);

            const response = await request(app)
                .post("/register")
                .send({
                    firstname: "John",
                    email: "new@test.com",
                    password: "password123"
                });

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
            expect(response.body.message).toBe("Invalid token");
        });

        test("should return 200 and verify user", async () => {
            const mockUser = {
                save: jest.fn().mockResolvedValue(true),
                isVerified: false
            };
            User.findOne.mockResolvedValue(mockUser);

            const response = await request(app).get("/verify?token=good-token");

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Email verified!");
            expect(mockUser.save).toHaveBeenCalled();
        });
    });
});