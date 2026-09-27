import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "./supabase";
import { slugify } from "./format";

export function ok(data = {}, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export const NEEDS_DB =
  "Supabase is not connected yet. Add your Supabase keys to .env.local, run supabase/schema.sql, then restart `npm run dev`.";

/** Returns the Supabase admin client, or null (caller should respond with NEEDS_DB) */
export function db() {
  return getSupabaseAdmin();
}

export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

const toList = (v) =>
  (Array.isArray(v) ? v : String(v || "").split(","))
    .map((s) => String(s).trim())
    .filter(Boolean);

const toInt = (v, fallback = 0) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

/** Clean + validate a product payload coming from the admin form */
export function cleanProduct(body, { partial = false } = {}) {
  const out = {};
  const has = (k) => body[k] !== undefined;

  if (!partial || has("name")) {
    out.name = String(body.name || "").trim().slice(0, 120);
    if (!out.name) return { error: "Product name is required" };
  }
  if (!partial || has("slug") || has("name")) {
    out.slug = slugify(body.slug || body.name || "");
    if (!out.slug) return { error: "Slug is invalid" };
  }
  if (!partial || has("price")) {
    out.price = toInt(body.price, -1);
    if (out.price < 0) return { error: "Price must be a positive number" };
  }
  if (!partial || has("compare_at_price")) {
    const c = toInt(body.compare_at_price, 0);
    out.compare_at_price = c > 0 ? c : null;
  }
  if (!partial || has("description")) out.description = String(body.description || "").trim().slice(0, 3000) || null;
  if (!partial || has("category_id")) out.category_id = body.category_id || null;
  if (!partial || has("images")) out.images = toList(body.images).slice(0, 10);
  if (!partial || has("sizes")) out.sizes = toList(body.sizes).slice(0, 30);
  if (!partial || has("colors")) out.colors = toList(body.colors).slice(0, 20);
  if (!partial || has("stock")) out.stock = Math.max(0, toInt(body.stock, 0));
  if (!partial || has("is_featured")) out.is_featured = Boolean(body.is_featured);
  if (!partial || has("is_active")) out.is_active = body.is_active === undefined ? true : Boolean(body.is_active);

  return { data: out };
}

/** Make a slug unique within a table by appending -2, -3 … */
export async function uniqueSlug(client, table, slug, excludeId) {
  let candidate = slug;
  for (let i = 2; i < 50; i++) {
    let q = client.from(table).select("id").eq("slug", candidate);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
    candidate = `${slug}-${i}`;
  }
  return `${slug}-${Date.now()}`;
}
