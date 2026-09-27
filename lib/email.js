// Email sending with Resend and Gmail (nodemailer).
// EMAIL_PROVIDER decides which one is tried first; the other is used as a fallback.
// (server-side only — never import from a "use client" file)

// Placeholder values from .env.local (e.g. "your-email@gmail.com", "re_xxxx") count as "not set"
function real(v) {
  if (!v) return false;
  const s = String(v).replace(/\s/g, "");
  return s.length > 0 && !/x{6,}/i.test(s) && !/^your-/i.test(s);
}

const resendConfigured = () => real(process.env.RESEND_API_KEY) && process.env.RESEND_API_KEY.startsWith("re_");
const gmailConfigured = () => real(process.env.GMAIL_USER) && real(process.env.GMAIL_APP_PASSWORD);

export function emailConfigured() {
  return resendConfigured() || gmailConfigured();
}

async function sendWithResend({ to, subject, html, replyTo }) {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM || "SMAHZ Shoes <onboarding@resend.dev>",
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
  if (error) throw new Error(error.message || "Resend error");
  return { provider: "resend", id: data?.id };
}

async function sendWithGmail({ to, subject, html, replyTo }) {
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: (process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, ""),
    },
  });
  const info = await transporter.sendMail({
    from: `"SMAHZ Shoes" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
  return { provider: "gmail", id: info.messageId };
}

/**
 * Send an email. Never throws — returns { ok, provider?, error? } so a failed
 * email never breaks an order.
 */
export async function sendEmail({ to, subject, html, replyTo }) {
  if (!to) return { ok: false, error: "No recipient" };

  const preferGmail = (process.env.EMAIL_PROVIDER || "resend").toLowerCase() === "gmail";
  const providers = [];
  const addResend = () => resendConfigured() && providers.push(sendWithResend);
  const addGmail = () => gmailConfigured() && providers.push(sendWithGmail);
  if (preferGmail) {
    addGmail();
    addResend();
  } else {
    addResend();
    addGmail();
  }

  if (!providers.length) {
    console.warn(`[email] No email provider configured — skipped "${subject}"`);
    return { ok: false, error: "Email not configured" };
  }

  const errors = [];
  for (const send of providers) {
    try {
      const res = await send({ to, subject, html, replyTo });
      return { ok: true, ...res };
    } catch (err) {
      console.error(`[email] ${send.name} failed:`, err.message);
      errors.push(err.message);
    }
  }
  return { ok: false, error: errors.join(" | ") };
}

export function adminEmail() {
  const v = process.env.ADMIN_EMAIL;
  return real(v) ? v : process.env.GMAIL_USER || null;
}
