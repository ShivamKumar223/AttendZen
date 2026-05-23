import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

/**
 * Sends an email using Resend.
 * Signature intentionally matches existing SMTP version.
 *
 * If Resend is not configured, it will NOT silently fail:
 *  - logs exactly which env vars are missing
 *  - returns { success:false, logged:true }
 *
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} [options.text]
 * @param {string} [options.html]
 */
export const sendEmailResend = async ({ to, subject, html, text }) => {
  const {
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
    // optional but supported: if you prefer explicit from name
    RESEND_FROM_NAME,
  } = process.env;

// console.log(RESEND_API_KEY);
// console.log(RESEND_FROM_EMAIL);
// console.log(RESEND_FROM_NAME);

  const missing = [];
  if (!RESEND_API_KEY) missing.push("RESEND_API_KEY");
  if (!RESEND_FROM_EMAIL) missing.push("RESEND_FROM_EMAIL");

  if (missing.length > 0) {
    console.warn("\n==================================================");
    console.warn("⚠️  RESEND CONFIGURATION MISSING IN BACKEND ENV");
    console.warn(`Missing: ${missing.join(", ")}`);
    console.warn(`TO: ${to}`);
    console.warn(`SUBJECT: ${subject}`);
    console.warn("------------------ MESSAGE BODY ------------------");
    const bodyText = text ?? (html ? html.replace(/<[^>]*>/g, "") : "");
    console.warn(bodyText);
    console.warn("==================================================\n");

    return { success: false, logged: true, missing };
  }

  const resend = new Resend(RESEND_API_KEY);

  const from = RESEND_FROM_NAME
    ? `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`
    : RESEND_FROM_EMAIL;

  try {

    console.log("TO EMAIL:", to);

    await resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
    });

    console.log(`📧 Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send email via Resend:", error);

    console.log("\n==================================================");
    console.log("⚠️  RESEND FAILED. FALLING BACK TO CONSOLE LOG:");
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log("------------------ MESSAGE BODY ------------------");
    const bodyText = text ?? (html ? html.replace(/<[^>]*>/g, "") : "");
    console.log(bodyText);
    console.log("==================================================\n");

    return {
      success: false,
      logged: true,
      error: error?.message || String(error),
    };
  }
};

