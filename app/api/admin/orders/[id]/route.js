import { fail, ok, readJson } from "@/lib/admin-api";
import { sendEmail } from "@/lib/email";
import { orderStatusEmail } from "@/lib/email-templates";
import { ORDER_STATUSES } from "@/lib/format";
import { deleteOrder, getOrder, updateOrder } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const { id } = await params;
  try {
    const order = await getOrder(id);
    if (!order) return fail("Order not found", 404);
    return ok({ order });
  } catch (err) {
    return fail(err.message, 500);
  }
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const body = await readJson(req);
  if (!body) return fail("Invalid request");

  const patch = {};
  if (body.status !== undefined) {
    if (!ORDER_STATUSES.some((s) => s.id === body.status)) return fail("Invalid status");
    patch.status = body.status;
  }
  if (body.tracking_note !== undefined) patch.tracking_note = String(body.tracking_note || "").slice(0, 500) || null;
  if (body.admin_note !== undefined) patch.admin_note = String(body.admin_note || "").slice(0, 2000) || null;

  try {
    const before = await getOrder(id);
    if (!before) return fail("Order not found", 404);
    const order = await updateOrder(id, patch);

    let notified = false;
    if (body.notify && order.email && patch.status && patch.status !== before.status) {
      const { subject, html } = orderStatusEmail(order);
      notified = (await sendEmail({ to: order.email, subject, html })).ok;
    }
    return ok({ order, notified });
  } catch (err) {
    return fail(err.message, 500);
  }
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  try {
    await deleteOrder(id);
    return ok({ ok: true });
  } catch (err) {
    return fail(err.message, 500);
  }
}
