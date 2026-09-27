import { NextResponse } from "next/server";
import { runAssistant } from "@/lib/assistant";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!rateLimit(`ai:${clientIp(req)}`, { limit: 40, windowMs: 60_000 })) {
    return NextResponse.json({ reply: "You're sending messages very fast 🙂 Please wait a moment." }, { status: 429 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await runAssistant({
      messages: body.messages,
      cart: body.cart,
      draft: body.draft,
      start: body.start,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[assistant]", err);
    return NextResponse.json(
      { reply: "Sorry, something went wrong on my side. Please try again, or order on WhatsApp.", quickReplies: [] },
      { status: 500 }
    );
  }
}
