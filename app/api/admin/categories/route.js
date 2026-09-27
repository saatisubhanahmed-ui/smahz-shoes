import { NEEDS_DB, db, fail, ok, readJson, uniqueSlug } from "@/lib/admin-api";
import { demoCategories, demoProducts } from "@/lib/demo-data";
import { slugify } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = db();
  if (!client) {
    const categories = demoCategories.map((c) => ({
      ...c,
      product_count: demoProducts.filter((p) => p.category_id === c.id).length,
    }));
    return ok({ categories, demoMode: true });
  }
  const [{ data, error }, { data: prods }] = await Promise.all([
    client.from("categories").select("*").order("sort_order").order("name"),
    client.from("products").select("category_id"),
  ]);
  if (error) return fail(error.message, 500);
  const counts = {};
  (prods || []).forEach((p) => (counts[p.category_id] = (counts[p.category_id] || 0) + 1));
  return ok({ categories: data.map((c) => ({ ...c, product_count: counts[c.id] || 0 })) });
}

export async function POST(req) {
  const client = db();
  if (!client) return fail(NEEDS_DB, 400);
  const body = await readJson(req);
  const name = String(body?.name || "").trim().slice(0, 60);
  if (!name) return fail("Category name is required");

  const row = {
    name,
    slug: await uniqueSlug(client, "categories", slugify(body.slug || name)),
    description: String(body.description || "").trim().slice(0, 200) || null,
    image_url: String(body.image_url || "").trim() || null,
    sort_order: parseInt(body.sort_order, 10) || 0,
  };
  const { data, error } = await client.from("categories").insert(row).select().single();
  if (error) return fail(error.message, 500);
  return ok({ category: data }, 201);
}
