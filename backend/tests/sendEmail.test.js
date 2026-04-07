
// Set dummy api key
process.env.SENDGRID_API_KEY = "dummy_key";
const sendVerificationEmail = require("../utils/sendEmail");
const sgMail = require("@sendgrid/mail");

// Mock SendGrid so it doesn't send real emails
jest.mock("@sendgrid/mail");


describe("Email Verification Utility", () => {

    beforeEach(() => {
        // Clear memory before each test
        jest.clearAllMocks();
        process.env.SENDGRID_API_KEY = "dummy_key";
    });

    test("should build the correct email message and send it", async () => {
        const testEmail = "user@test.com";
        const testToken = "fakeToken";

        await sendVerificationEmail(testEmail, testToken);

        // Check if sgMail.send was called with the right data
        expect(sgMail.send).toHaveBeenCalledTimes(1);

        // Check the message object specifically
        const sentMsg = sgMail.send.mock.calls[0][0];
        expect(sentMsg.to).toBe(testEmail);
        expect(sentMsg.from).toBe("ascent.careers.emailer@gmail.com");
        expect(sentMsg.subject).toBe("Verify your account");

        // Check if the HTML contains our token URL
        expect(sentMsg.html).toContain(`token=${testToken}`);
        expect(sentMsg.html).toContain("https://miniapp4331.com/verify");
    });

    test("should log an error if SendGrid fails", async () => {
        // Force SendGrid to throw an error
        sgMail.send.mockRejectedValue(new Error("SendGrid Down"));

        // Check if console.error was called
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });

        const testEmail = "user@test.com";
        const testToken = "fakeToken";

        await sendVerificationEmail(testEmail, testToken);

        expect(consoleSpy).toHaveBeenCalledWith("Error sending email:", expect.any(Error));

        // Clean up
        consoleSpy.mockRestore();
    });
});