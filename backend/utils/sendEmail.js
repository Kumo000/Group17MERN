const sgMail = require("@sendgrid/mail");

console.log("SendGrid Key in sendEmail.js:", process.env.SENDGRID_API_KEY);

sgMail.setApiKey(process.env.SENDGRID_API_KEY.trim());

const sendVerificationEmail = async (toEmail, token) => {
  const url = `https://miniapp4331.com/verify?token=${token}`;

  const msg = {
    to: toEmail,
    from: "ascent.careers.emailer@gmail.com", // must be verified in SendGrid
    subject: "Verify your account",
    html: `
      <h2>Email Verification</h2>
      <p>Click the link below:</p>
      <a href="${url}">${url}</a>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("Verification email sent to", toEmail);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const sendResetPasswordEmail = async (toEmail, token) => {
  const url = `https://miniapp4331.com/reset-password?token=${token}`;

  const msg = {
    to: toEmail,
    from: "ascent.careers.emailer@gmail.com",
    subject: "Reset your password",
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
      <a href="${url}">${url}</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("Password reset email sent to", toEmail);
  } catch (error) {
    console.error("Error sending reset email:", error);
  }
};

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
