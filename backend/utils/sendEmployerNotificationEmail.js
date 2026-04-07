const nodemailer = require("nodemailer");

/**
 * Notifies the employer when an applicant accepts or rejects an interview.
 *
 * @param {string} toEmail       - Employer's email address
 * @param {string} employerName  - Employer's first name
 * @param {string} applicantName - Full name of the applicant
 * @param {string} applicantEmail - Applicant's email
 * @param {string} jobTitle      - Title of the job
 * @param {string} response      - "accept" or "reject"
 */
const sendEmployerNotificationEmail = async (toEmail, employerName, applicantName, applicantEmail, jobTitle, response) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const accepted = response === "accept";

    const mailOptions = {
        from: `"Ascent" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `${applicantName} has ${accepted ? "accepted" : "declined"} your interview request — ${jobTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 2rem; border-radius: 12px; border: 1px solid #ddd;">
                <h2 style="color: #321e5a;">Interview ${accepted ? "Accepted ✅" : "Declined ❌"}</h2>
                <p>Hi <strong>${employerName}</strong>,</p>
                <p>
                    <strong>${applicantName}</strong> (${applicantEmail}) has
                    <strong>${accepted ? "accepted" : "declined"}</strong>
                    your interview request for the position <strong>${jobTitle}</strong>.
                </p>
                ${accepted
                    ? `<p>Their status has been updated to <strong>Interview Pending</strong> on your listings page. You can now choose to <strong>Hire</strong> or <strong>Reject</strong> them.</p>`
                    : `<p>Their application has been marked as rejected.</p>`
                }
                <hr style="border: none; border-top: 1px solid #eee; margin: 1.5rem 0;" />
                <p style="color: #aaa; font-size: 0.78rem;">Ascent — climb the ladder. reach your career potential.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmployerNotificationEmail;
