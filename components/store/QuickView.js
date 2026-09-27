"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import SizeColorPicker from "./SizeColorPicker";
import { discountPercent, formatPrice } from "@/lib/format";
import { CartIcon, CloseIcon } from "../Icons";

export default function QuickView() {
  const { quickView: product, closeQuickView, addItem } = useCart();
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [shake, setShake] = useState(false);
  const [needSize, setNeedSize] = useState(false);

  useEffect(() => {
    setSize("");
    setNeedSize(false);
    setColor(product?.colors?.[0] || "");
    setQty(1);
  }, [product]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeQuickView();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeQuickView]);

  if (!product) return null;
  const off = discountPercent(product.price, product.compare_at_price);

  function add() {
    if (product.sizes?.length && !size) {
      setShake(true);
      setNeedSize(true);
      setTimeout(() => setShake(false), 450);
      return;
    }
    addItem(product, { size, color, quantity: qty });
  }

  return (
    <div className="modal-wrap">
      <div className="overlay" onClick={closeQuickView} />
      <div className="modal modal-lg" role="dialog" aria-modal="true" aria-label={product.name} style={{ zIndex: 111 }}>
        <button className="icon-btn modal-close" onClick={closeQuickView} aria-label="Close">
          <CloseIcon size={18} />
        </button>
        <div className="quick-view">
          <ProductImage src={product.images?.[0]} alt={product.name} />
          <div>
            {product.category?.name && <span className="eyebrow">{product.category.name}</span>}
            <h3 className="h2" style={{ fontSize: 28, marginTop: 10 }}>{product.name}</h3>
            <div className="pdp-price" style={{ margin: "12px 0 6px" }}>
              <span className="price" style={{ fontSize: 24 }}>{formatPrice(product.price)}</span>
              {off > 0 && <span className="price-old">{formatPrice(product.compare_at_price)}</span>}
              {off > 0 && <span className="badge badge-red">Save {off}%</span>}
            </div>

            <SizeColorPicker product={product} size={size} setSize={setSize} color={color} setColor={setColor} shake={shake} />
            {needSize && !size && <p className="field-error mt-8">Please select your size</p>}

            <div className="flex gap-12 mt-24">
              <div className="qty qty-lg">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase">+</button>
              </div>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={add}>
                <CartIcon size={18} /> Add to cart
              </button>
            </div>
            <Link href={`/product/${product.slug}`} className="link-arrow mt-16" style={{ display: "inline-flex" }} onClick={closeQuickView}>
              View full details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
