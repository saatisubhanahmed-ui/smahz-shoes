import { NEEDS_DB, cleanProduct, db, fail, ok, readJson, uniqueSlug } from "@/lib/admin-api";
import { demoProducts } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = db();
  if (!client) return ok({ products: demoProducts, demoMode: true });
  const { data, error } = await client
    .from("products")
    .select("*, category:categories(id,name,slug)")
    .order("created_at", { ascending: false });
  if (error) return fail(error.message, 500);
  return ok({ products: data });
}

export async function POST(req) {
  const client = db();
  if (!client) return fail(NEEDS_DB, 400);
  const body = await readJson(req);
  if (!body) return fail("Invalid request");

  const { data, error } = cleanProduct(body);
  if (error) return fail(error);
  data.slug = await uniqueSlug(client, "products", data.slug);

  const { data: product, error: dbError } = await client.from("products").insert(data).select().single();
  if (dbError) return fail(dbError.message, 500);
  return ok({ product }, 201);
}
