import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/store/ProductCard";
import ProductDetail from "@/components/store/ProductDetail";
import { getProductBySlug, getRelatedProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description?.slice(0, 160),
    openGraph: { images: product.images?.slice(0, 1) },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product, 4);

  return (
    <>
      <section className="section-sm">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link> / <Link href="/shop">Shop</Link>
            {product.category && (
              <>
                {" "}/ <Link href={`/shop?category=${product.category.slug}`}>{product.category.name}</Link>
              </>
            )}
            {" "}/ <span>{product.name}</span>
          </div>
          <ProductDetail product={product} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">You may also like</span>
                <h2 className="h2">Related products</h2>
              </div>
            </div>
            <div className="grid-products">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
