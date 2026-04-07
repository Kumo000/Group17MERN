const nodemailer = require("nodemailer");

/**
 * Sends an interview request email to the applicant.
 * Accept/Reject links contain a one-time token that the backend validates.
 *
 * @param {string} toEmail       - Applicant's email address
 * @param {string} applicantName - Applicant's first name
 * @param {string} jobTitle      - Title of the job
 * @param {string} company       - Company name
 * @param {string} token         - One-time interview token stored on the applicant subdoc
 */
const sendInterviewEmail = async (toEmail, applicantName, jobTitle, company, token) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const baseUrl = process.env.VITE_API_URL || process.env.API_URL || "http://localhost:5000";
    const acceptUrl = `${baseUrl}/api/jobs/interview/respond?token=${token}&response=accept`;
    const rejectUrl = `${baseUrl}/api/jobs/interview/respond?token=${token}&response=reject`;

    const mailOptions = {
        from: `"Ascent" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Interview Request — ${jobTitle} at ${company}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 2rem; border-radius: 12px; border: 1px solid #ddd;">
                <h2 style="color: #321e5a;">Interview Request</h2>
                <p>Hi <strong>${applicantName}</strong>,</p>
                <p>
                    You have been requested to interview for the position
                    <strong>${jobTitle}</strong> at <strong>${company}</strong>.
                </p>
                <p>Please respond below:</p>
                <div style="display: flex; gap: 1rem; margin: 1.5rem 0;">
                    <a href="${acceptUrl}"
                       style="background-color: #2e7d32; color: white; padding: 0.7rem 1.5rem;
                              border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 12px;">
                        ✅ Accept Interview
                    </a>
                    <a href="${rejectUrl}"
                       style="background-color: #c62828; color: white; padding: 0.7rem 1.5rem;
                              border-radius: 8px; text-decoration: none; font-weight: bold;">
                        ❌ Decline Interview
                    </a>
                </div>
                <p style="color: #888; font-size: 0.85rem;">
                    This link is for your use only and will expire after you respond.
                    If you did not apply for this position, you can ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 1.5rem 0;" />
                <p style="color: #aaa; font-size: 0.78rem;">Ascent — climb the ladder. reach your career potential.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendInterviewEmail;
