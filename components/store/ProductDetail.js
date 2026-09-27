"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import SizeColorPicker from "./SizeColorPicker";
import { discountPercent, formatPrice } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";
import { CartIcon, CashIcon, RefreshIcon, TruckIcon, WhatsAppIcon } from "../Icons";

export default function ProductDetail({ product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const images = product.images?.length ? product.images : [""];
  const [active, setActive] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState(product.colors?.[0] || "");
  const [qty, setQty] = useState(1);
  const [shake, setShake] = useState(false);
  const [needSize, setNeedSize] = useState(false);

  const off = discountPercent(product.price, product.compare_at_price);
  const soldOut = product.stock !== undefined && product.stock !== null && product.stock <= 0;

  function ensureSize() {
    if (product.sizes?.length && !size) {
      setShake(true);
      setNeedSize(true);
      setTimeout(() => setShake(false), 450);
      return false;
    }
    return true;
  }

  function add() {
    if (ensureSize()) addItem(product, { size, color, quantity: qty });
  }

  function buyNow() {
    if (!ensureSize()) return;
    addItem(product, { size, color, quantity: qty, silent: true });
    router.push("/checkout");
  }

  const waText = `Hi SMAHZ! I'm interested in *${product.name}* (${formatPrice(product.price)})${size ? `, size ${size}` : ""}. ${site.url}/product/${product.slug}`;

  return (
    <div className="pdp">
      <div>
        <div className="gallery-main">
          <ProductImage src={images[active]} alt={product.name} loading="eager" />
          {off > 0 && (
            <div className="pc-badges">
              <span className="badge badge-red">-{off}%</span>
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="thumbs">
            {images.map((src, i) => (
              <button key={src + i} className={i === active ? "active" : ""} onClick={() => setActive(i)} aria-label={`Image ${i + 1}`}>
                <ProductImage src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pdp-info">
        {product.category?.name && <span className="eyebrow">{product.category.name}</span>}
        <h1 className="h1">{product.name}</h1>
        <div className="pdp-price">
          <span className="price">{formatPrice(product.price)}</span>
          {off > 0 && <span className="price-old">{formatPrice(product.compare_at_price)}</span>}
          {off > 0 && <span className="badge badge-red">Save {formatPrice(product.compare_at_price - product.price)}</span>}
        </div>
        <span className={`stock ${soldOut ? "out" : ""}`}>
          {soldOut ? "Out of stock" : product.stock && product.stock < 10 ? `Only ${product.stock} left` : "In stock — ready to ship"}
        </span>

        {product.description && <p className="muted mt-16" style={{ fontSize: 16, lineHeight: 1.75 }}>{product.description}</p>}

        <SizeColorPicker product={product} size={size} setSize={setSize} color={color} setColor={setColor} shake={shake} />
        {needSize && !size && <p className="field-error mt-8">Please select your size</p>}

        <div className="opt-label">
          <span>Quantity</span>
        </div>
        <div className="qty qty-lg">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
          <span>{qty}</span>
          <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase">+</button>
        </div>

        <div className="pdp-actions">
          <button className="btn btn-outline btn-lg" onClick={add} disabled={soldOut}>
            <CartIcon size={18} /> Add to cart
          </button>
          <button className="btn btn-primary btn-lg" onClick={buyNow} disabled={soldOut}>
            Buy it now
          </button>
        </div>
        <a className="btn btn-wa btn-block mt-16" href={whatsappLink(waText)} target="_blank" rel="noreferrer">
          <WhatsAppIcon size={18} /> Ask about this on WhatsApp
        </a>

        <div className="pdp-perks">
          <div><CashIcon size={20} /> Cash on Delivery available all over Pakistan</div>
          <div><TruckIcon size={20} /> Delivery in 2–5 business days · Free above {formatPrice(site.shipping.freeAbove)}</div>
          <div><RefreshIcon size={20} /> Wrong size? Easy 7-day exchange</div>
        </div>
      </div>
    </div>
  );
}
