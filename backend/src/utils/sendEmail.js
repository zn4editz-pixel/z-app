// utils/sendEmail.js
import nodemailer from "nodemailer";

const sendEmail = async (to, subject, html) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email credentials not configured. Set EMAIL_USER and EMAIL_PASS environment variables.");
      console.error("💡 For Gmail: Use App Password, not your regular password");
      console.error("💡 Generate App Password: https://myaccount.google.com/apppasswords");
      throw new Error("Email service not configured");
    }

    console.log(`📧 Attempting to send email to ${to}...`);
    console.log(`📧 Using email service: ${process.env.EMAIL_USER}`);

    // Create a transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // App password (NOT your real Gmail password)
      },
      // Add timeout and retry options
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log("✅ Email transporter verified successfully");
    } catch (verifyError) {
      console.error("❌ Email transporter verification failed:", verifyError.message);
      if (verifyError.code === 'EAUTH') {
        throw new Error("Authentication failed. Check EMAIL_USER and EMAIL_PASS.");
      }
      throw verifyError;
    }

    // Send the email
    const info = await transporter.sendMail({
      from: `"Z-APP Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error stack:", error.stack);
    
    if (error.code === 'EAUTH') {
      console.error("❌ Authentication failed. Check EMAIL_USER and EMAIL_PASS.");
      console.error("💡 For Gmail: Use App Password, not your regular password");
      throw new Error("Authentication failed. Check EMAIL_USER and EMAIL_PASS.");
    } else if (error.code === 'ECONNECTION') {
      console.error("❌ Connection failed. Check your internet connection.");
      throw new Error("Connection failed. Check your internet connection.");
    } else if (error.code === 'ETIMEDOUT') {
      console.error("❌ Connection timed out. Try again later.");
      throw new Error("Connection timed out. Try again later.");
    }
    
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

export default sendEmail;
