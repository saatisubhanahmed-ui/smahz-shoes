import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function looksReal(value) {
  return Boolean(value) && !/YOUR-PROJECT-ID|^your-/i.test(value);
}

/** True once real Supabase keys are in .env.local */
export function isSupabaseConfigured() {
  return looksReal(url) && url.startsWith("http") && looksReal(anonKey) && looksReal(serviceKey);
}

let adminClient = null;

/**
 * Server-only client using the service_role key (bypasses RLS).
 * Never import this into a "use client" component.
 */
export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) return null;
  if (!adminClient) {
    adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

export const PRODUCT_BUCKET = "products";
