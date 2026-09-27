// Admin authentication — a signed session cookie.
// Works in both the Edge runtime (middleware) and Node (route handlers) via Web Crypto.

export const ADMIN_COOKIE = "smahz_admin";
export const SESSION_DAYS = 7;

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Token changes automatically whenever the admin password or secret changes. */
export async function expectedToken() {
  const user = process.env.ADMIN_USERNAME || "admin";
  const pass = process.env.ADMIN_PASSWORD || "";
  const secret = process.env.AUTH_SECRET || "smahz-dev-secret";
  if (!pass) return null;
  return sha256Hex(`${user}:${pass}:${secret}`);
}

export async function isValidToken(token) {
  if (!token) return false;
  const expected = await expectedToken();
  if (!expected || token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export function checkCredentials(username, password) {
  const user = process.env.ADMIN_USERNAME || "admin";
  const pass = process.env.ADMIN_PASSWORD || "";
  return Boolean(pass) && username === user && password === pass;
}
