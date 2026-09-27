import { escapeHtml as e, formatPrice, CHANNEL_LABELS } from "./format";
import { site } from "./site";

const GOLD = "#e11d2a"; // brand accent (red)

function layout(title, body) {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
      <tr><td style="background:#0a0a0a;padding:22px 28px">
        <div style="font-size:26px;font-weight:800;letter-spacing:4px;color:#fff">SMA<span style="color:${GOLD}">H</span>Z</div>
        <div style="font-size:11px;letter-spacing:6px;color:${GOLD};margin-top:2px">SHOES</div>
      </td></tr>
      <tr><td style="padding:28px">
        <h1 style="margin:0 0 16px;font-size:20px">${title}</h1>
        ${body}
      </td></tr>
      <tr><td style="background:#fafafa;padding:16px 28px;font-size:12px;color:#71717a;border-top:1px solid #eee">
        ${site.fullName} · WhatsApp ${site.phoneDisplay} · ${e(site.email)}
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function row(label, value) {
  return `<tr><td style="padding:6px 0;color:#71717a;width:140px;vertical-align:top">${label}</td><td style="padding:6px 0;font-weight:600">${value}</td></tr>`;
}

function itemsTable(order) {
  const rows = order.items
    .map(
      (it) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee">${e(it.name)}<br><span style="color:#71717a;font-size:12px">Size ${e(it.size || "-")}${it.color ? " · " + e(it.color) : ""} · Qty ${it.quantity}</span></td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatPrice(it.price * it.quantity)}</td>
      </tr>`
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:16px 0">
    ${rows}
    <tr><td style="padding:8px 0;color:#71717a">Subtotal</td><td style="text-align:right">${formatPrice(order.subtotal)}</td></tr>
    <tr><td style="padding:4px 0;color:#71717a">Delivery</td><td style="text-align:right">${order.shipping ? formatPrice(order.shipping) : "FREE"}</td></tr>
    <tr><td style="padding:8px 0;font-weight:800;font-size:16px">Total</td><td style="text-align:right;font-weight:800;font-size:16px;color:${GOLD}">${formatPrice(order.total)}</td></tr>
  </table>`;
}

export function adminOrderEmail(order) {
  const body = `
    <p style="margin:0 0 12px">A new order was placed via <b>${CHANNEL_LABELS[order.channel] || order.channel}</b>.</p>
    <table cellpadding="0" cellspacing="0" style="font-size:14px">
      ${row("Order #", e(order.order_number))}
      ${row("Customer", e(order.customer_name))}
      ${row("Phone", e(order.phone))}
      ${order.email ? row("Email", e(order.email)) : ""}
      ${row("City", e(order.city))}
      ${row("Address", e(order.address))}
      ${row("Payment", e(order.payment_method_label || order.payment_method))}
      ${order.notes ? row("Notes", e(order.notes)) : ""}
    </table>
    ${itemsTable(order)}
    <p style="margin:20px 0 0"><a href="${site.url}/admin/orders/${order.id}" style="background:#0a0a0a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Open in Admin Panel</a></p>`;
  return {
    subject: `🛒 New order ${order.order_number} — ${formatPrice(order.total)} (${order.customer_name})`,
    html: layout(`New order ${e(order.order_number)}`, body),
  };
}

export function customerOrderEmail(order) {
  const body = `
    <p style="margin:0 0 12px">Hi ${e(order.customer_name)}, thanks for shopping with SMAHZ! We've received your order and will confirm it on WhatsApp shortly.</p>
    <div style="background:#0a0a0a;color:#fff;border-radius:10px;padding:16px 18px;margin:16px 0">
      <div style="font-size:12px;color:#a1a1aa;letter-spacing:2px">YOUR ORDER NUMBER</div>
      <div style="font-size:22px;font-weight:800;letter-spacing:2px;color:${GOLD}">${e(order.order_number)}</div>
    </div>
    ${itemsTable(order)}
    <p style="font-size:14px;color:#52525b">Delivering to: ${e(order.address)}, ${e(order.city)}</p>
    <p style="margin:20px 0 0"><a href="${site.url}/track-order?order=${encodeURIComponent(order.order_number)}" style="background:${GOLD};color:#0a0a0a;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Track your order</a></p>`;
  return {
    subject: `Your SMAHZ order ${order.order_number} is received`,
    html: layout("Order received ✔", body),
  };
}

export function orderStatusEmail(order) {
  const body = `
    <p>Hi ${e(order.customer_name)}, your order <b>${e(order.order_number)}</b> is now <b style="color:${GOLD};text-transform:uppercase">${e(order.status)}</b>.</p>
    ${order.tracking_note ? `<p style="background:#fafafa;border-left:3px solid ${GOLD};padding:10px 14px">${e(order.tracking_note)}</p>` : ""}
    <p style="margin:20px 0 0"><a href="${site.url}/track-order?order=${encodeURIComponent(order.order_number)}" style="background:#0a0a0a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">Track order</a></p>`;
  return { subject: `Order ${order.order_number} update: ${order.status}`, html: layout("Order update", body) };
}

export function contactEmail(msg) {
  const body = `
    <table cellpadding="0" cellspacing="0" style="font-size:14px">
      ${row("Name", e(msg.name))}
      ${row("Email", e(msg.email))}
      ${msg.phone ? row("Phone", e(msg.phone)) : ""}
      ${msg.subject ? row("Subject", e(msg.subject)) : ""}
    </table>
    <div style="margin-top:16px;padding:16px;background:#fafafa;border-radius:8px;white-space:pre-wrap;font-size:14px;line-height:1.6">${e(msg.message)}</div>
    <p style="font-size:12px;color:#71717a;margin-top:16px">Reply to this email to answer ${e(msg.name)} directly.</p>`;
  return {
    subject: `✉️ Contact form: ${msg.subject || "New message"} — ${msg.name}`,
    html: layout("New message from your website", body),
  };
}
