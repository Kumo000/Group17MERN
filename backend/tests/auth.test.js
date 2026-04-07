const authMiddleware = require("../middleware/auth");
const jwt = require("jsonwebtoken");

// Mock the jsonwebtoken library so it doesn't actually try to verify strings
jest.mock("jsonwebtoken");

describe("Auth Middleware Unit Tests", () => {
    let req, res, next;

    // Reset mock objext
    beforeEach(() => {
        req = {
            header: jest.fn(),
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
        process.env.JWT_SECRET = "testsecret";
    });

    test("should return 401 if no token is provided", () => {
        // Setup header to not return token
        req.header.mockReturnValue(null);

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ msg: "No token, denied" });
        expect(next).not.toHaveBeenCalled();
    });

    test("should return 401 if token is invalid", () => {
        // Provide a token but make jwt.verify throw an error
        req.header.mockReturnValue("invalid-token");
        jwt.verify.mockImplementation(() => {
            throw new Error();
        });

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ msg: "Token is not valid" });
        expect(next).not.toHaveBeenCalled();
    });

    test("should call next() and add user to req if token is valid", () => {
        // Provide a token and a mock user object
        const mockUser = { user: { id: "12345" } };
        req.header.mockReturnValue("valid-token");
        jwt.verify.mockReturnValue(mockUser);

        authMiddleware(req, res, next);

        expect(req.user).toEqual(mockUser.user); // Check if user id was attached to req object
        expect(next).toHaveBeenCalled(); // Ensure it moved to the next middleware
        expect(res.status).not.toHaveBeenCalled();
    });
});