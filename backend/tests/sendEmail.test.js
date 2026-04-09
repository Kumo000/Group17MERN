
// Set dummy api key
process.env.SENDGRID_API_KEY = "dummy_key";
const sgMail = require("@sendgrid/mail");
const { sendVerificationEmail, sendResetPasswordEmail } = require("../utils/sendEmail"); // update path as needed

// Mock the SendGrid module
jest.mock("@sendgrid/mail", () => ({
    setApiKey: jest.fn(),
    send: jest.fn(),
}));

describe("Email Utility Helpers", () => {
    const testEmail = "test@user.com";
    const testToken = "123456";

    beforeEach(() => {
        // Clear mock history before each test
        jest.clearAllMocks();
    });

    describe("sendVerificationEmail", () => {
        test("should call sgMail.send with correct verification details", async () => {
            // Mock the send method to resolve successfully
            sgMail.send.mockResolvedValue([{}]);

            await sendVerificationEmail(testEmail, testToken);

            // Verify it was called once
            expect(sgMail.send).toHaveBeenCalledTimes(1);

            // Verify the content
            const callArgs = sgMail.send.mock.calls[0][0];
            expect(callArgs.to).toBe(testEmail);
            expect(callArgs.subject).toBe("Verify your account");
            expect(callArgs.html).toContain(`verify?token=${testToken}`);
        });

        test("should log an error if sgMail.send fails", async () => {
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
            sgMail.send.mockRejectedValue(new Error("Network Error"));

            await sendVerificationEmail(testEmail, testToken);

            expect(consoleErrorSpy).toHaveBeenCalledWith("Error sending email:", expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });

    describe("sendResetPasswordEmail", () => {
        test("should call sgMail.send with correct password reset details", async () => {
            sgMail.send.mockResolvedValue([{}]);

            await sendResetPasswordEmail(testEmail, testToken);

            expect(sgMail.send).toHaveBeenCalledTimes(1);

            const callArgs = sgMail.send.mock.calls[0][0];
            expect(callArgs.to).toBe(testEmail);
            expect(callArgs.subject).toBe("Reset your password");
            expect(callArgs.html).toContain(`reset-password?token=${testToken}`);
        });

        test("should log an error if sending reset email fails", async () => {
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
            sgMail.send.mockRejectedValue(new Error("SendGrid Failed"));

            await sendResetPasswordEmail(testEmail, testToken);

            expect(consoleErrorSpy).toHaveBeenCalledWith("Error sending reset email:", expect.any(Error));
            consoleErrorSpy.mockRestore();
        });
    });
});