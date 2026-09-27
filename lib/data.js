// Server-side data access for the storefront.
// Falls back to demo data when Supabase isn't configured, so the site
// works right after `npm run dev`.
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import { demoCategories, demoProducts } from "./demo-data";

const PRODUCT_SELECT = "*, category:categories(id,name,slug)";

export async function getCategories() {
  const db = getSupabaseAdmin();
  if (!db) return demoCategories;
  const { data, error } = await db.from("categories").select("*").order("sort_order").order("name");
  if (error) {
    console.error("[getCategories]", error.message);
    return [];
  }
  return data;
}

export async function getProducts({ category, featured, limit, search, sort } = {}) {
  const db = getSupabaseAdmin();

  if (!db) {
    let list = [...demoProducts];
    if (category) list = list.filter((p) => p.category?.slug === category);
    if (featured) list = list.filter((p) => p.is_featured);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    list = sortProducts(list, sort);
    return limit ? list.slice(0, limit) : list;
  }

  let query = db.from("products").select(PRODUCT_SELECT).eq("is_active", true);

  if (category) {
    const { data: cat } = await db.from("categories").select("id").eq("slug", category).maybeSingle();
    if (!cat) return [];
    query = query.eq("category_id", cat.id);
  }
  if (featured) query = query.eq("is_featured", true);
  if (search) query = query.ilike("name", `%${search}%`);

  if (sort === "price-asc") query = query.order("price", { ascending: true });
  else if (sort === "price-desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error("[getProducts]", error.message);
    return [];
  }
  return data;
}

export async function getProductBySlug(slug) {
  const db = getSupabaseAdmin();
  if (!db) return demoProducts.find((p) => p.slug === slug) || null;
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) console.error("[getProductBySlug]", error.message);
  return data || null;
}

export async function getRelatedProducts(product, limit = 4) {
  const all = await getProducts({ category: product.category?.slug, limit: limit + 1 });
  const related = all.filter((p) => p.id !== product.id).slice(0, limit);
  if (related.length >= limit) return related;
  const more = await getProducts({ limit: limit + 4 });
  const ids = new Set([product.id, ...related.map((p) => p.id)]);
  return [...related, ...more.filter((p) => !ids.has(p.id))].slice(0, limit);
}

/** Look up real prices for cart items (prevents price tampering from the browser). */
export async function getProductsByIds(ids) {
  const db = getSupabaseAdmin();
  if (!db) return demoProducts.filter((p) => ids.includes(p.id));
  const { data, error } = await db.from("products").select("id,name,slug,price,images,is_active,stock").in("id", ids);
  if (error) throw new Error(error.message);
  return data;
}

function sortProducts(list, sort) {
  if (sort === "price-asc") return list.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return list.sort((a, b) => b.price - a.price);
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
