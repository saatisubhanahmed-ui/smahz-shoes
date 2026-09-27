// Orders & contact messages storage.
// Uses Supabase when configured; otherwise keeps data in server memory
// (demo mode — resets when `npm run dev` restarts).
import { getSupabaseAdmin } from "./supabase";

const mem = globalThis.__smahzMemory || (globalThis.__smahzMemory = { orders: [], messages: [] });
const uid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now() + Math.random()));

/* ----------------------------- Orders ----------------------------- */

export async function insertOrder(order) {
  const db = getSupabaseAdmin();
  if (!db) {
    const now = new Date().toISOString();
    const row = { id: uid(), status: "pending", created_at: now, updated_at: now, ...order };
    mem.orders.unshift(row);
    return row;
  }
  const { data, error } = await db.from("orders").insert(order).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function findOrderByNumber(orderNumber) {
  const db = getSupabaseAdmin();
  const num = orderNumber.trim().toUpperCase();
  if (!db) return mem.orders.find((o) => o.order_number === num) || null;
  const { data, error } = await db.from("orders").select("*").eq("order_number", num).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listOrders({ status, search, channel, page = 1, pageSize = 20 } = {}) {
  const db = getSupabaseAdmin();
  if (!db) {
    let list = [...mem.orders];
    if (status) list = list.filter((o) => o.status === status);
    if (channel) list = list.filter((o) => o.channel === channel);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        [o.order_number, o.customer_name, o.phone, o.city].some((v) => (v || "").toLowerCase().includes(q))
      );
    }
    const start = (page - 1) * pageSize;
    return { rows: list.slice(start, start + pageSize), count: list.length };
  }

  let q = db.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  if (channel) q = q.eq("channel", channel);
  if (search) {
    const s = search.replace(/[%,()]/g, "");
    q = q.or(`order_number.ilike.%${s}%,customer_name.ilike.%${s}%,phone.ilike.%${s}%,city.ilike.%${s}%`);
  }
  const from = (page - 1) * pageSize;
  q = q.range(from, from + pageSize - 1);
  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { rows: data, count: count || 0 };
}

export async function getOrder(id) {
  const db = getSupabaseAdmin();
  if (!db) return mem.orders.find((o) => o.id === id) || null;
  const { data, error } = await db.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateOrder(id, patch) {
  const db = getSupabaseAdmin();
  if (!db) {
    const o = mem.orders.find((x) => x.id === id);
    if (!o) return null;
    Object.assign(o, patch, { updated_at: new Date().toISOString() });
    return o;
  }
  const { data, error } = await db.from("orders").update(patch).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteOrder(id) {
  const db = getSupabaseAdmin();
  if (!db) {
    mem.orders = mem.orders.filter((o) => o.id !== id);
    return true;
  }
  const { error } = await db.from("orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

export async function orderStats() {
  const db = getSupabaseAdmin();
  let rows;
  if (!db) rows = mem.orders;
  else {
    const { data, error } = await db
      .from("orders")
      .select("id,total,status,channel,created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    rows = data;
  }

  const byStatus = {};
  const byChannel = { checkout: 0, whatsapp: 0, email: 0, ai: 0 };
  let revenue = 0;
  for (const o of rows) {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    byChannel[o.channel] = (byChannel[o.channel] || 0) + 1;
    if (o.status !== "cancelled") revenue += o.total || 0;
  }

  // Last 14 days of sales (keys use the server's local date)
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const days = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    days.push({ date: dayKey(d), orders: 0, revenue: 0 });
  }
  const idx = Object.fromEntries(days.map((d, i) => [d.date, i]));
  for (const o of rows) {
    const key = dayKey(new Date(o.created_at));
    if (key in idx && o.status !== "cancelled") {
      days[idx[key]].orders += 1;
      days[idx[key]].revenue += o.total || 0;
    }
  }

  return { total: rows.length, revenue, byStatus, byChannel, days };
}

/* ------------------------- Contact messages ------------------------ */

export async function insertMessage(msg) {
  const db = getSupabaseAdmin();
  if (!db) {
    const row = { id: uid(), is_read: false, created_at: new Date().toISOString(), ...msg };
    mem.messages.unshift(row);
    return row;
  }
  const { data, error } = await db.from("contact_messages").insert(msg).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listMessages() {
  const db = getSupabaseAdmin();
  if (!db) return mem.messages;
  const { data, error } = await db.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error(error.message);
  return data;
}

export async function updateMessage(id, patch) {
  const db = getSupabaseAdmin();
  if (!db) {
    const m = mem.messages.find((x) => x.id === id);
    if (m) Object.assign(m, patch);
    return m;
  }
  const { data, error } = await db.from("contact_messages").update(patch).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMessage(id) {
  const db = getSupabaseAdmin();
  if (!db) {
    mem.messages = mem.messages.filter((m) => m.id !== id);
    return true;
  }
  const { error } = await db.from("contact_messages").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}
