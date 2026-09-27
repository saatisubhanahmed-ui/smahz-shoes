import { NextResponse } from "next/server";
import { OrderError, createOrder, publicOrder } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req) {
  if (!rateLimit(`order:${clientIp(req)}`, { limit: 6, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many orders from this device. Please wait a minute." }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { order, emailed } = await createOrder({
      channel: body.channel,
      customer: body.customer,
      payment_method: body.payment_method,
      items: body.items,
    });
    return NextResponse.json({ ok: true, emailed, order: publicOrder(order) });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message, errors: err.details }, { status: err.status });
    }
    console.error("[orders]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
