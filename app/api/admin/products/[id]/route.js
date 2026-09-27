import { NEEDS_DB, cleanProduct, db, fail, ok, readJson, uniqueSlug } from "@/lib/admin-api";
import { demoProducts } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const { id } = await params;
  const client = db();
  if (!client) {
    const product = demoProducts.find((p) => p.id === id);
    return product ? ok({ product }) : fail("Not found", 404);
  }
  const { data, error } = await client.from("products").select("*").eq("id", id).maybeSingle();
  if (error) return fail(error.message, 500);
  if (!data) return fail("Not found", 404);
  return ok({ product: data });
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const client = db();
  if (!client) return fail(NEEDS_DB, 400);
  const body = await readJson(req);
  if (!body) return fail("Invalid request");

  const { data, error } = cleanProduct(body, { partial: true });
  if (error) return fail(error);
  if (data.slug) data.slug = await uniqueSlug(client, "products", data.slug, id);

  const { data: product, error: dbError } = await client.from("products").update(data).eq("id", id).select().single();
  if (dbError) return fail(dbError.message, 500);
  return ok({ product });
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  const client = db();
  if (!client) return fail(NEEDS_DB, 400);
  const { error } = await client.from("products").delete().eq("id", id);
  if (error) return fail(error.message, 500);
  return ok({ ok: true });
}
