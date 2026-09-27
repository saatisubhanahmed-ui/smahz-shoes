// Single place where orders are created — used by the checkout / WhatsApp /
// email flows (/api/orders) and by the AI assistant (/api/assistant).
import { getProductsByIds } from "./data";
import { adminEmail, sendEmail } from "./email";
import { adminOrderEmail, customerOrderEmail } from "./email-templates";
import { generateOrderNumber } from "./format";
import { insertOrder } from "./repo";
import { calcShipping, site } from "./site";
import { normalizePhone, validateCustomer } from "./validation";

export const CHANNELS = ["checkout", "whatsapp", "email", "ai"];

export class OrderError extends Error {
  constructor(message, status = 400, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Turns raw cart lines [{product_id,size,color,quantity}] into priced items
 * using REAL prices from the database (the browser can't change prices).
 */
export async function priceCart(rawItems) {
  const lines = Array.isArray(rawItems) ? rawItems.slice(0, 30) : [];
  if (!lines.length) throw new OrderError("Your cart is empty");

  let products;
  try {
    products = await getProductsByIds([...new Set(lines.map((i) => i.product_id))]);
  } catch (err) {
    console.error("[orders] product lookup failed", err);
    throw new OrderError("Could not verify products. Please try again.", 500);
  }
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));

  const items = lines.map((raw) => {
    const p = byId[raw.product_id];
    if (!p || p.is_active === false) throw new OrderError("One of the products in your cart is no longer available.");
    return {
      product_id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.images?.[0] || "",
      size: String(raw.size || "").slice(0, 10),
      color: String(raw.color || "").slice(0, 30),
      price: p.price,
      quantity: Math.min(Math.max(parseInt(raw.quantity, 10) || 1, 1), 20),
    };
  });

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = calcShipping(subtotal);
  return { items, subtotal, shipping, total: subtotal + shipping };
}

/** Validates, saves and emails an order. Throws OrderError on bad input. */
export async function createOrder({ channel, customer = {}, payment_method, items: rawItems }) {
  channel = CHANNELS.includes(channel) ? channel : "checkout";

  const errors = validateCustomer(customer);
  if (Object.keys(errors).length) throw new OrderError(Object.values(errors)[0], 400, errors);

  const paymentIds = site.paymentMethods.map((p) => p.id);
  payment_method = paymentIds.includes(payment_method) ? payment_method : "cod";

  const cart = await priceCart(rawItems);

  const orderData = {
    customer_name: String(customer.customer_name).trim().slice(0, 100),
    phone: normalizePhone(customer.phone).slice(0, 20),
    email: String(customer.email || "").trim().slice(0, 120) || null,
    city: String(customer.city).trim().slice(0, 60),
    address: String(customer.address).trim().slice(0, 300),
    notes: String(customer.notes || "").trim().slice(0, 500) || null,
    ...cart,
    payment_method,
    channel,
  };

  // Save (retry if the random order number collides)
  let order;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    try {
      order = await insertOrder({ ...orderData, order_number: generateOrderNumber() });
    } catch (err) {
      if (!/duplicate|unique/i.test(err.message) || attempt === 2) {
        console.error("[orders] insert failed", err);
        if (/channel_check/i.test(err.message)) {
          throw new OrderError("Database needs the latest update — run supabase/update-v2.sql in Supabase.", 500);
        }
        throw new OrderError("Could not save your order. Please try again or order on WhatsApp.", 500);
      }
    }
  }

  // Email notifications (never block the order)
  const payment_method_label = site.paymentMethods.find((p) => p.id === payment_method)?.label;
  const forEmail = { ...order, payment_method_label };
  const to = adminEmail();
  const tasks = [];
  if (to) {
    const { subject, html } = adminOrderEmail(forEmail);
    tasks.push(sendEmail({ to, subject, html, replyTo: order.email || undefined }));
  }
  if (order.email) {
    const { subject, html } = customerOrderEmail(forEmail);
    tasks.push(sendEmail({ to: order.email, subject, html }));
  }
  const results = await Promise.all(tasks);
  const emailed = Boolean(to && results[0]?.ok); // true when the store inbox received it

  return { order, emailed };
}

/** The safe subset of an order that can be returned to the browser */
export function publicOrder(order) {
  return {
    id: order.id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    phone: order.phone,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    payment_method: order.payment_method,
    channel: order.channel,
  };
}
