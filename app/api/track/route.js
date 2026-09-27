import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { findOrderByNumber } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!rateLimit(`track:${clientIp(req)}`, { limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }
  const orderNumber = (req.nextUrl.searchParams.get("order") || "").trim();
  if (!/^[A-Za-z0-9-]{4,30}$/.test(orderNumber)) {
    return NextResponse.json({ error: "Please enter a valid order number, e.g. SMZ-7K3PMX9A" }, { status: 400 });
  }

  try {
    const o = await findOrderByNumber(orderNumber);
    if (!o) return NextResponse.json({ error: "No order found with that number. Please check and try again." }, { status: 404 });

    // Only return what the customer needs — never the full address or phone
    return NextResponse.json({
      order: {
        order_number: o.order_number,
        status: o.status,
        created_at: o.created_at,
        updated_at: o.updated_at,
        city: o.city,
        items: o.items,
        subtotal: o.subtotal,
        shipping: o.shipping,
        total: o.total,
        tracking_note: o.tracking_note,
      },
    });
  } catch (err) {
    console.error("[track]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
