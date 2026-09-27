import { NextResponse } from "next/server";
import { ADMIN_COOKIE, SESSION_DAYS, checkCredentials, expectedToken } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req) {
  if (!rateLimit(`login:${clientIp(req)}`, { limit: 8, windowMs: 5 * 60_000 })) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }
  let body = {};
  try {
    body = await req.json();
  } catch {}

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "ADMIN_PASSWORD is not set in .env.local" }, { status: 500 });
  }
  if (!checkCredentials(String(body.username || "").trim(), String(body.password || ""))) {
    return NextResponse.json({ error: "Wrong username or password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}
