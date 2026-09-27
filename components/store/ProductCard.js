"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import { discountPercent, formatPrice } from "@/lib/format";
import { CartIcon } from "../Icons";

export default function ProductCard({ product, priority = false }) {
  const { openQuickView } = useCart();
  const off = discountPercent(product.price, product.compare_at_price);
  const soldOut = product.stock !== undefined && product.stock !== null && product.stock <= 0;
  const [img1, img2] = product.images || [];

  return (
    <article className="product-card">
      <Link href={`/product/${product.slug}`} className="pc-media" aria-label={product.name}>
        <ProductImage src={img1} alt={product.name} loading={priority ? "eager" : "lazy"} />
        {img2 && <ProductImage src={img2} alt="" className="img-2" />}
        <div className="pc-badges">
          {soldOut ? (
            <span className="badge">Sold out</span>
          ) : (
            <>
              {off > 0 && <span className="badge badge-red">-{off}%</span>}
              {product.is_featured && <span className="badge badge-accent">Hot</span>}
            </>
          )}
        </div>
      </Link>

      {!soldOut && (
        <div className="pc-quick">
          <button className="btn btn-light btn-block btn-sm" onClick={() => openQuickView(product)}>
            <CartIcon size={16} /> Quick Add
          </button>
        </div>
      )}

      <div className="pc-body">
        {product.category?.name && <span className="pc-cat">{product.category.name}</span>}
        <Link href={`/product/${product.slug}`} className="pc-name">
          {product.name}
        </Link>
        <div className="price-row">
          <span className="price">{formatPrice(product.price)}</span>
          {off > 0 && <span className="price-old">{formatPrice(product.compare_at_price)}</span>}
        </div>
        {!soldOut && (
          <button className="btn btn-dark btn-sm btn-block pc-mobile-add" onClick={() => openQuickView(product)}>
            Add to cart
          </button>
        )}
      </div>
    </article>
  );
}
