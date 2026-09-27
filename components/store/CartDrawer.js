"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import QuickOrderModal from "./QuickOrderModal";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import { ArrowRight, CloseIcon, MailIcon, SparkleIcon, WhatsAppIcon } from "../Icons";

export default function CartDrawer() {
  const { items, drawerOpen, closeDrawer, updateQty, removeItem, subtotal, shipping, total, openAssistant } = useCart();
  const [orderChannel, setOrderChannel] = useState(null); // 'whatsapp' | 'email' | null

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !orderChannel && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDrawer, orderChannel]);

  if (!drawerOpen) return null;

  const remaining = Math.max(site.shipping.freeAbove - subtotal, 0);
  const progress = Math.min((subtotal / site.shipping.freeAbove) * 100, 100);

  return (
    <>
      <div className="overlay" onClick={closeDrawer} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Shopping cart">
        <div className="drawer-head">
          <h3 className="h3">Your Cart {items.length > 0 && <span className="muted">({items.length})</span>}</h3>
          <button className="icon-btn" onClick={closeDrawer} aria-label="Close cart">
            <CloseIcon size={18} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="drawer-body" style={{ display: "grid", placeItems: "center", textAlign: "center" }}>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/placeholder-shoe.svg" alt="" width="140" height="140" style={{ margin: "0 auto 18px", borderRadius: 20, opacity: 0.8 }} />
              <p className="muted">Your cart is empty.</p>
              <Link href="/shop" className="link-arrow mt-16" onClick={closeDrawer} style={{ display: "inline-flex" }}>
                Start shopping <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="drawer-body">
              <div style={{ padding: "14px 0 6px" }}>
                <p className="free-ship">
                  {remaining > 0 ? (
                    <>
                      Add <b style={{ color: "var(--accent-2)" }}>{formatPrice(remaining)}</b> more for <b>FREE delivery</b>
                    </>
                  ) : (
                    <>🎉 You&apos;ve unlocked <b>FREE delivery</b></>
                  )}
                </p>
                <div className="progress">
                  <div style={{ width: `${progress}%` }} />
                </div>
              </div>

              {items.map((item) => (
                <div className="cart-item" key={item.key}>
                  <Link href={`/product/${item.slug}`} onClick={closeDrawer}>
                    <ProductImage src={item.image} alt={item.name} />
                  </Link>
                  <div>
                    <h4>{item.name}</h4>
                    <div className="meta">
                      Size {item.size || "-"}
                      {item.color ? ` · ${item.color}` : ""}
                    </div>
                    <div className="qty">
                      <button onClick={() => updateQty(item.key, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQty(item.key, item.quantity + 1)} aria-label="Increase quantity">+</button>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="price" style={{ fontSize: 15 }}>{formatPrice(item.price * item.quantity)}</div>
                    <button className="remove-btn" onClick={() => removeItem(item.key)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer-foot">
              <div className="sum-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="sum-row"><span>Delivery</span><span>{shipping ? formatPrice(shipping) : "FREE"}</span></div>
              <div className="sum-row total"><span>Total</span><span>{formatPrice(total)}</span></div>

              <p className="order-options-label">Choose how to order</p>

              <button className="btn btn-ai btn-block" onClick={() => openAssistant("order")}>
                <span className="new-tag">NEW</span>
                <SparkleIcon size={18} /> Order with AI Assistant
              </button>

              <button className="btn btn-wa btn-block" onClick={() => setOrderChannel("whatsapp")}>
                <WhatsAppIcon size={18} /> Send Order on WhatsApp
              </button>
              <button className="btn btn-outline btn-block" onClick={() => setOrderChannel("email")}>
                <MailIcon size={18} /> Send Order on Email
              </button>
              <Link href="/checkout" className="btn btn-primary btn-block" onClick={closeDrawer}>
                Checkout &amp; Place Order <ArrowRight size={18} />
              </Link>
            </div>
          </>
        )}
      </aside>

      {orderChannel && <QuickOrderModal channel={orderChannel} onClose={() => setOrderChannel(null)} />}
    </>
  );
}
