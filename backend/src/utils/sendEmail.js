// utils/sendEmail.js
import nodemailer from "nodemailer";

const sendEmail = async (to, subject, html) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email credentials not configured. Set EMAIL_USER and EMAIL_PASS environment variables.");
      throw new Error("Email service not configured");
    }

    // Create a transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // App password (NOT your real Gmail password)
      },
    });

    // Verify transporter configuration
    await transporter.verify();
    console.log("✅ Email transporter verified");

    // Send the email
    const info = await transporter.sendMail({
      from: `"Z-APP Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent to ${to} - Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    if (error.code === 'EAUTH') {
      console.error("❌ Authentication failed. Check EMAIL_USER and EMAIL_PASS.");
    }
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

export default sendEmail;
