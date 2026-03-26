const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ascent.careers.emailer@gmail.com",        // your app email
    pass: "nmvv jawl ksfa trlc",        // Gmail app password
  },
});

const sendVerificationEmail = async (toEmail, token) => {
  const url = `http://localhost:5173/verify?token=${token}`;

  try {
    await transporter.sendMail({
      from: "ascent.careers.emailer@gmail.com", //must match authenticated Gmail
      to: toEmail,
      subject: "Verify your account",
      html: `
        <h2>Email Verification</h2>
        <p>Click the link below:</p>
        <a href="${url}">${url}</a>
      `,
    });
    console.log("Verification email sent to", toEmail);
  } catch (err) {
    console.error("Failed to send verification email:", err.message);
    // Optionally: don’t throw, just warn
    // throw err;
  }
};

module.exports = sendVerificationEmail;
