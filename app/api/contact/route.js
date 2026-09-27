import { NextResponse } from "next/server";
import { adminEmail, emailConfigured, sendEmail } from "@/lib/email";
import { contactEmail } from "@/lib/email-templates";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { insertMessage } from "@/lib/repo";
import { EMAIL_RE } from "@/lib/validation";

export async function POST(req) {
  if (!rateLimit(`contact:${clientIp(req)}`, { limit: 5, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many messages. Please wait a minute and try again." }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field
  if (body.company) return NextResponse.json({ ok: true });

  const msg = {
    name: String(body.name || "").trim().slice(0, 100),
    email: String(body.email || "").trim().slice(0, 120),
    phone: String(body.phone || "").trim().slice(0, 20) || null,
    subject: String(body.subject || "").trim().slice(0, 120) || null,
    message: String(body.message || "").trim().slice(0, 5000),
  };

  if (msg.name.length < 2) return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
  if (!EMAIL_RE.test(msg.email)) return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
  if (msg.message.length < 10) return NextResponse.json({ error: "Message should be at least 10 characters" }, { status: 400 });

  let saved = false;
  try {
    await insertMessage(msg);
    saved = true;
  } catch (err) {
    console.error("[contact] save failed", err.message);
  }

  const to = adminEmail();
  let emailed = false;
  if (to && emailConfigured()) {
    const { subject, html } = contactEmail(msg);
    const res = await sendEmail({ to, subject, html, replyTo: msg.email });
    emailed = res.ok;
  }

  if (!saved && !emailed) {
    return NextResponse.json(
      { error: "We couldn't send your message right now. Please contact us on WhatsApp instead." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, emailed });
}
