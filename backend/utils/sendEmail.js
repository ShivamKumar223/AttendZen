// NOTE: SMTP (nodemailer) replaced by Resend for deliverability.
// Keeping the same exported function name + signature for functional compatibility.

import { sendEmailResend } from "./sendEmailResend.js";

/**
 * Sends an email using Resend.
 * If Resend is not configured, it will NOT silently fail:
 *  - logs exactly which env vars are missing
 *  - returns { success:false, logged:true }
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text version of message
 * @param {string} [options.html] - HTML version of message
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  return sendEmailResend({ to, subject, html, text });
};

