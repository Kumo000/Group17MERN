// Set dummy environment variables
process.env.SENDGRID_API_KEY = "SG.dummy_key";
process.env.JWT_SECRET = "test_secret_123";

const express = require("express");
const request = require("supertest");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Import router
const router = require("../routes/userRoutes");

// Setup app for testing
const app = express();
app.use(express.json());
app.use("/", router);

// We don't mock JWT entirely because we want to verify it works
jest.mock("../models/User");
jest.mock("bcryptjs");

describe("API Path: /login", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should return 400 if user does not exist", async () => {
        User.findOne.mockResolvedValue(null);

        const response = await request(app)
            .post("/login")
            .send({ email: "wrong@test.com", password: "password123" });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid credentials");
    });

    test("should return 400 if user is not verified", async () => {
        User.findOne.mockResolvedValue({
            email: "not-verified@test.com",
            isVerified: false
        });

        const response = await request(app)
            .post("/login")
            .send({ email: "not-verified@test.com", password: "password123" });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Verify your email first");
    });

    test("should return 400 if password does not match", async () => {
        User.findOne.mockResolvedValue({
            email: "user@test.com",
            isVerified: true,
            password: "hashed_password"
        });
        // Mock bcrypt to say "No Match"
        bcrypt.compare.mockResolvedValue(false);

        const response = await request(app)
            .post("/login")
            .send({ email: "user@test.com", password: "wrong_password" });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid credentials");
    });

    test("should return 200, JWT, and user data on success", async () => {
        const mockUser = {
            _id: "user123",
            email: "john@test.com",
            isVerified: true,
            password: "hashed_password",
            role: "applicant",
            _doc: {
                _id: "user123",
                firstname: "John",
                email: "john@test.com",
                role: "applicant",
                password: "hashed_password"
            }
        };

        User.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);

        const response = await request(app)
            .post("/login")
            .send({ email: "john@test.com", password: "password123" });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Login success");

        // Check if a token was returned
        expect(response.body.token).toBeDefined();

        // Check if sensitive data was excluded
        expect(response.body.user.password).toBeUndefined();
        expect(response.body.user.email).toBe("john@test.com");
    });
});