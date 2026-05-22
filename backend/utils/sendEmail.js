import nodemailer from "nodemailer";

/**
 * Sends an email using SMTP or logs to console as a dev fallback.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text version of message
 * @param {string} options.html - HTML version of message
 */

export const sendEmail = async ({ to, subject, html, text }) => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  // Fallback check: if SMTP configurations are not fully set up in .env, log in console
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.log("\n==================================================");
    console.log("⚠️  EMAIL CONFIGURATION MISSING IN BACKEND .env");
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log("------------------ MESSAGE BODY ------------------");
    console.log(text || html.replace(/<[^>]*>/g, "")); // strip basic HTML for clean console output
    console.log("==================================================\n");
    return { success: true, logged: true };
  }

  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT || "587"),
    secure: EMAIL_PORT === "465", // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    // Prevent long hangs (common cause of slow registration)
    connectionTimeout: parseInt(process.env.EMAIL_CONNECTION_TIMEOUT_MS || "8000"),
    greetingTimeout: parseInt(process.env.EMAIL_GREETING_TIMEOUT_MS || "8000"),
    socketTimeout: parseInt(process.env.EMAIL_SOCKET_TIMEOUT_MS || "8000"),
  });

  const mailOptions = {
    from: `"AttendZen Support" <${EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send email via SMTP:", error);
    // Even if sending fails, in development we don't want to crash or block the developer,
    // so we log the fallback so they can still see the OTP!
    console.log("\n==================================================");
    console.log("⚠️  SMTP FAILED. FALLING BACK TO CONSOLE LOG:");
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log("------------------ MESSAGE BODY ------------------");
    console.log(text || html.replace(/<[^>]*>/g, ""));
    console.log("==================================================\n");
    return { success: true, logged: true };
  }
};