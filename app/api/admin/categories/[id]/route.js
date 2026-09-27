import { NEEDS_DB, db, fail, ok, readJson, uniqueSlug } from "@/lib/admin-api";
import { slugify } from "@/lib/format";

export async function PATCH(req, { params }) {
  const { id } = await params;
  const client = db();
  if (!client) return fail(NEEDS_DB, 400);
  const body = await readJson(req);
  if (!body) return fail("Invalid request");

  const patch = {};
  if (body.name !== undefined) {
    patch.name = String(body.name).trim().slice(0, 60);
    if (!patch.name) return fail("Category name is required");
  }
  if (body.slug !== undefined || body.name !== undefined) {
    patch.slug = await uniqueSlug(client, "categories", slugify(body.slug || body.name), id);
  }
  if (body.description !== undefined) patch.description = String(body.description || "").trim().slice(0, 200) || null;
  if (body.image_url !== undefined) patch.image_url = String(body.image_url || "").trim() || null;
  if (body.sort_order !== undefined) patch.sort_order = parseInt(body.sort_order, 10) || 0;

  const { data, error } = await client.from("categories").update(patch).eq("id", id).select().single();
  if (error) return fail(error.message, 500);
  return ok({ category: data });
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  const client = db();
  if (!client) return fail(NEEDS_DB, 400);
  const { error } = await client.from("categories").delete().eq("id", id);
  if (error) return fail(error.message, 500);
  return ok({ ok: true });
}
