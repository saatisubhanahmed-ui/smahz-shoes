"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/store/CartProvider";
import CustomerFields from "@/components/store/CustomerFields";
import { emptyCustomer, validateCustomer } from "@/lib/validation";
import ProductImage from "@/components/store/ProductImage";
import { formatPrice } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";
import { ArrowRight, CheckIcon, EditIcon, ShieldIcon, SparkleIcon, WhatsAppIcon } from "@/components/Icons";

export default function CheckoutPage() {
  const cart = useCart();
  const [customer, setCustomer] = useState(emptyCustomer);
  const [payment, setPayment] = useState("cod");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [placed, setPlaced] = useState(null);

  async function placeOrder(e) {
    e.preventDefault();
    const errs = validateCustomer(customer);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.querySelector(".field-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "checkout",
          customer,
          payment_method: payment,
          items: cart.items.map((i) => ({ product_id: i.product_id, size: i.size, color: i.color, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place your order. Please try again.");
      setPlaced(data.order);
      cart.clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ---------- Success ---------- */
  if (placed) {
    return (
      <section className="section">
        <div className="container">
          <div className="success-box">
            <div className="success-icon">
              <CheckIcon size={42} />
            </div>
            <span className="eyebrow">Order confirmed</span>
            <h1 className="h1" style={{ marginTop: 12 }}>Thank you, {placed.customer_name.split(" ")[0]}!</h1>
            <p className="lead" style={{ margin: "14px auto 0" }}>
              Your order has been placed. We&apos;ll call or WhatsApp you on <b>{placed.phone}</b> to confirm delivery.
            </p>
            <div className="order-code">{placed.order_number}</div>
            <p className="small muted">Total {formatPrice(placed.total)} · {site.paymentMethods.find((p) => p.id === placed.payment_method)?.label}</p>
            <div className="flex gap-12 wrap mt-32" style={{ justifyContent: "center" }}>
              <Link href={`/track-order?order=${placed.order_number}`} className="btn btn-primary btn-lg">
                Track order <ArrowRight size={18} />
              </Link>
              <a className="btn btn-wa btn-lg" target="_blank" rel="noreferrer" href={whatsappLink(`Hi SMAHZ! I just placed order ${placed.order_number}.`)}>
                <WhatsAppIcon size={18} /> Confirm on WhatsApp
              </a>
            </div>
            <Link href="/shop" className="link-arrow mt-24" style={{ display: "inline-flex" }}>
              Continue shopping →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* ---------- Empty cart ---------- */
  if (cart.loaded && cart.items.length === 0) {
    return (
      <section className="section">
        <div className="container text-center">
          <h1 className="h1">Your cart is empty</h1>
          <p className="lead" style={{ margin: "14px auto 28px" }}>Add a pair you love, then come back to check out.</p>
          <Link href="/shop" className="btn btn-primary btn-lg">
            Browse shoes <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    );
  }

  /* ---------- Checkout form ---------- */
  return (
    <>
      <section className="page-head" style={{ padding: "56px 0 40px" }}>
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link> / <span>Checkout</span>
          </div>
          <h1 className="h1">Checkout</h1>
        </div>
      </section>

      <section className="section-sm">
        <form className="container checkout-grid" onSubmit={placeOrder} noValidate>
          <div style={{ display: "grid", gap: 20, alignContent: "start" }}>
            <div>
              <p className="order-options-label" style={{ textAlign: "left", marginBottom: 12 }}>How would you like to place your order?</p>
              <div className="order-way">
                <button type="button" className="active" onClick={() => document.getElementById("cf-name")?.focus()}>
                  <span className="ow-ic"><EditIcon size={20} /></span>
                  <div>
                    <b>Fill the form</b>
                    <span>Enter your details below</span>
                  </div>
                </button>
                <button type="button" className="ai" onClick={() => cart.openAssistant("order")}>
                  <span className="ow-ic"><SparkleIcon size={20} /></span>
                  <div>
                    <b>Order with AI Assistant</b>
                    <span>Just chat — AI fills it for you</span>
                  </div>
                </button>
              </div>
            </div>
            <div className="card-panel">
              <h2 className="h3" style={{ marginBottom: 20 }}>1. Delivery details</h2>
              <CustomerFields value={customer} onChange={setCustomer} errors={errors} />
            </div>

            <div className="card-panel">
              <h2 className="h3" style={{ marginBottom: 20 }}>2. Payment method</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {site.paymentMethods.map((m) => (
                  <label key={m.id} className="pay-option">
                    <input type="radio" name="payment" value={m.id} checked={payment === m.id} onChange={() => setPayment(m.id)} />
                    <div>
                      <b>{m.label}</b>
                      <span>{m.note}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <aside className="card-panel summary">
            <h2 className="h3" style={{ marginBottom: 8 }}>Order summary</h2>
            {cart.items.map((it) => (
              <div className="summary-item" key={it.key}>
                <ProductImage src={it.image} alt={it.name} />
                <div>
                  <b>{it.name}</b>
                  <div className="small muted">
                    Size {it.size || "-"}
                    {it.color ? ` · ${it.color}` : ""} · Qty {it.quantity}
                  </div>
                </div>
                <b>{formatPrice(it.price * it.quantity)}</b>
              </div>
            ))}
            <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
              <div className="sum-row"><span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span></div>
              <div className="sum-row"><span>Delivery</span><span>{cart.shipping ? formatPrice(cart.shipping) : "FREE"}</span></div>
              <div className="sum-row total"><span>Total</span><span>{formatPrice(cart.total)}</span></div>
            </div>

            {serverError && <div className="alert alert-error mt-16">{serverError}</div>}

            <button type="submit" className="btn btn-primary btn-lg btn-block mt-24" disabled={loading || !cart.loaded}>
              {loading ? <span className="spinner" /> : null}
              {loading ? "Placing order…" : `Place order · ${formatPrice(cart.total)}`}
            </button>
            <p className="small muted mt-16 flex items-center gap-8" style={{ justifyContent: "center" }}>
              <ShieldIcon size={16} /> Your details are only used to deliver your order.
            </p>
          </aside>
        </form>
      </section>
    </>
  );
}
