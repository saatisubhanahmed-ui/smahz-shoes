import Link from "next/link";
import { Suspense } from "react";
import ProductCard from "@/components/store/ProductCard";
import ShopControls from "@/components/store/ShopControls";
import { getCategories, getProducts } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shop" };

export default async function ShopPage({ searchParams }) {
  const sp = await searchParams;
  const category = typeof sp?.category === "string" ? sp.category : "";
  const sort = typeof sp?.sort === "string" ? sp.sort : "";
  const search = typeof sp?.q === "string" ? sp.q : "";

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ category: category || undefined, sort, search: search || undefined }),
  ]);
  const active = categories.find((c) => c.slug === category);

  const chipHref = (slug) => {
    const p = new URLSearchParams();
    if (slug) p.set("category", slug);
    if (sort) p.set("sort", sort);
    if (search) p.set("q", search);
    const s = p.toString();
    return `/shop${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link> / <span>Shop</span>
            {active && <> / <span>{active.name}</span></>}
          </div>
          <span className="eyebrow">Shop SMAHZ</span>
          <h1 className="h1">{active ? active.name : "What are you shopping for?"}</h1>
          <p className="lead">{active?.description || "Pick a category to see everything in it — every pair ships with Cash on Delivery."}</p>
          <div className="rule" />
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="toolbar">
            <div className="chips">
              <Link href={chipHref("")} className={`chip ${!category ? "active" : ""}`}>
                All
              </Link>
              {categories.map((c) => (
                <Link key={c.id} href={chipHref(c.slug)} className={`chip ${category === c.slug ? "active" : ""}`}>
                  {c.name}
                </Link>
              ))}
            </div>
            <Suspense>
              <ShopControls />
            </Suspense>
          </div>

          <p className="small muted" style={{ marginBottom: 18 }}>
            {products.length} product{products.length === 1 ? "" : "s"}
            {search && <> for “{search}”</>}
          </p>

          {products.length === 0 ? (
            <div className="empty">
              {categories.length === 0
                ? "No categories yet. Add categories and products from the admin panel at /admin."
                : "No products found. Try another category or search."}
            </div>
          ) : (
            <div className="grid-products">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
