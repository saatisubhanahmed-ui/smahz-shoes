import { NEEDS_DB, db, fail, ok } from "@/lib/admin-api";
import { PRODUCT_BUCKET } from "@/lib/supabase";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" };

export async function POST(req) {
  const client = db();
  if (!client) return fail(NEEDS_DB, 400);

  let form;
  try {
    form = await req.formData();
  } catch {
    return fail("Invalid upload");
  }
  const file = form.get("file");
  if (!file || typeof file === "string") return fail("No file received");
  if (!TYPES[file.type]) return fail("Only JPG, PNG, WEBP, AVIF or GIF images are allowed");
  if (file.size > MAX_BYTES) return fail("Image must be smaller than 5 MB");

  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${TYPES[file.type]}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await client.storage.from(PRODUCT_BUCKET).upload(path, buffer, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return fail(`Upload failed: ${error.message}`, 500);

  const { data } = client.storage.from(PRODUCT_BUCKET).getPublicUrl(path);
  return ok({ url: data.publicUrl });
}
