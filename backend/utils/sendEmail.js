import nodemailer from "nodemailer";

/**
 * Sends an email using SMTP.
 * If SMTP is not configured (common on production deploy), it will NOT silently fail:
 *   - logs exactly which env vars are missing
 *   - returns { success:false, logged:true }
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text version of message
 * @param {string} [options.html] - HTML version of message
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  const missing = [];
  if (!EMAIL_HOST) missing.push("EMAIL_HOST");
  if (!EMAIL_USER) missing.push("EMAIL_USER");
  if (!EMAIL_PASS) missing.push("EMAIL_PASS");

  // If SMTP is not configured, fall back to console so you still see OTP,
  // but ALSO log what exactly is missing.
  if (missing.length > 0) {
    console.warn("\n==================================================");
    console.warn("⚠️  EMAIL CONFIGURATION MISSING IN BACKEND ENV");
    console.warn(`Missing: ${missing.join(", ")}`);
    console.warn(`TO: ${to}`);
    console.warn(`SUBJECT: ${subject}`);
    console.warn("------------------ MESSAGE BODY ------------------");
    const bodyText =
      text ?? (html ? html.replace(/<[^>]*>/g, "") : "");
    console.warn(bodyText);
    console.warn("==================================================\n");

    return { success: false, logged: true, missing };
  }

  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT || "587", 10),
    secure: String(EMAIL_PORT || "587") === "465", // true for 465
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    connectionTimeout: parseInt(process.env.EMAIL_CONNECTION_TIMEOUT_MS || "8000", 10),
    greetingTimeout: parseInt(process.env.EMAIL_GREETING_TIMEOUT_MS || "8000", 10),
    socketTimeout: parseInt(process.env.EMAIL_SOCKET_TIMEOUT_MS || "8000", 10),
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

    // Keep UX non-blocking, but log the body so you can still debug OTP.
    console.log("\n==================================================");
    console.log("⚠️  SMTP FAILED. FALLING BACK TO CONSOLE LOG:");
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log("------------------ MESSAGE BODY ------------------");
    const bodyText = text ?? (html ? html.replace(/<[^>]*>/g, "") : "");
    console.log(bodyText);
    console.log("==================================================\n");

    return { success: false, logged: true, error: error?.message || String(error) };
  }
};

