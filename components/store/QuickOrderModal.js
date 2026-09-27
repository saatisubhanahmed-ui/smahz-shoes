"use client";

import Link from "next/link";
import { useState } from "react";
import { buildOrderText, useCart } from "./CartProvider";
import CustomerFields from "./CustomerFields";
import { emptyCustomer, validateCustomer } from "@/lib/validation";
import { formatPrice } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";
import { CheckIcon, CloseIcon, MailIcon, WhatsAppIcon } from "../Icons";

/**
 * Collects delivery details, saves the order (so it shows in the admin panel
 * and can be tracked), then:
 *  - whatsapp: opens WhatsApp chat with the full order pre-typed
 *  - email:    emails the order to the store (and a copy to the customer)
 */
export default function QuickOrderModal({ channel, onClose }) {
  const cart = useCart();
  const [customer, setCustomer] = useState(emptyCustomer);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(null); // { order_number, waUrl, mailto, emailed }

  const isWa = channel === "whatsapp";

  async function submit(e) {
    e.preventDefault();
    const errs = validateCustomer(customer);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setServerError("");

    // Open the WhatsApp tab right away (inside the click) so pop-up blockers allow it
    const waWindow = isWa ? window.open("", "_blank") : null;
    const snapshot = { items: cart.items, subtotal: cart.subtotal, shipping: cart.shipping, total: cart.total };

    let orderNumber = null;
    let emailed = false;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          customer,
          payment_method: "cod",
          items: cart.items.map((i) => ({ product_id: i.product_id, size: i.size, color: i.color, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place order");
      orderNumber = data.order.order_number;
      emailed = data.emailed;
      snapshot.subtotal = data.order.subtotal;
      snapshot.shipping = data.order.shipping;
      snapshot.total = data.order.total;
    } catch (err) {
      if (!isWa) {
        setServerError(err.message);
        setLoading(false);
        return;
      }
      // For WhatsApp we still send the order even if saving failed
      console.error(err);
    }

    const text = buildOrderText(snapshot, customer, orderNumber);
    const waUrl = whatsappLink(text);
    const mailto = `mailto:${site.email}?subject=${encodeURIComponent(`SMAHZ Order ${orderNumber || ""}`)}&body=${encodeURIComponent(text.replace(/\*/g, ""))}`;

    if (isWa) {
      if (waWindow) waWindow.location.href = waUrl;
      else window.location.href = waUrl;
    }

    cart.clearCart();
    setDone({ order_number: orderNumber, waUrl, mailto, emailed });
    setLoading(false);
  }

  return (
    <div className="modal-wrap">
      <div className="overlay" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" style={{ zIndex: 111 }}>
        <button className="icon-btn modal-close" onClick={onClose} aria-label="Close">
          <CloseIcon size={18} />
        </button>

        {done ? (
          <div className="success-box">
            <div className="success-icon">
              <CheckIcon size={40} />
            </div>
            <h3 className="h2" style={{ fontSize: 28 }}>
              {isWa ? "Order sent on WhatsApp!" : "Order sent by Email!"}
            </h3>
            <p className="muted mt-8">
              {isWa
                ? "Press send in WhatsApp so we receive your order. We'll confirm it there shortly."
                : done.emailed
                ? "We've received your order by email and will confirm it on WhatsApp shortly."
                : "Your order is saved. Tap below to also send it from your email app."}
            </p>
            {done.order_number && (
              <>
                <div className="order-code">{done.order_number}</div>
                <p className="small muted">Save this number to track your order.</p>
              </>
            )}
            <div className="flex gap-12 wrap mt-24" style={{ justifyContent: "center" }}>
              {isWa ? (
                <a className="btn btn-wa" href={done.waUrl} target="_blank" rel="noreferrer">
                  <WhatsAppIcon size={18} /> Open WhatsApp again
                </a>
              ) : (
                <a className="btn btn-dark" href={done.mailto}>
                  <MailIcon size={18} /> Open email app
                </a>
              )}
              {done.order_number && (
                <Link href={`/track-order?order=${done.order_number}`} className="btn btn-primary" onClick={() => { onClose(); cart.closeDrawer(); }}>
                  Track order
                </Link>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="flex items-center gap-12" style={{ marginBottom: 6 }}>
              <span className="icon-btn" style={{ background: isWa ? "rgba(37,211,102,.14)" : "var(--accent-soft)", color: isWa ? "var(--wa)" : "var(--accent)", border: 0 }}>
                {isWa ? <WhatsAppIcon size={20} /> : <MailIcon size={20} />}
              </span>
              <div>
                <h3 className="h3">{isWa ? "Send order on WhatsApp" : "Send order on Email"}</h3>
                <p className="small muted">
                  {cart.count} item{cart.count === 1 ? "" : "s"} · Total {formatPrice(cart.total)} · Cash on Delivery
                </p>
              </div>
            </div>
            <p className="small muted" style={{ margin: "14px 0 18px" }}>
              Enter your delivery details — we&apos;ll {isWa ? "open WhatsApp with your order ready to send" : "email your order to our team"}.
            </p>

            <CustomerFields value={customer} onChange={setCustomer} errors={errors} compact />

            {serverError && <div className="alert alert-error mt-16">{serverError}</div>}

            <button type="submit" className={`btn btn-block btn-lg mt-24 ${isWa ? "btn-wa" : "btn-primary"}`} disabled={loading || cart.items.length === 0}>
              {loading ? <span className="spinner" /> : isWa ? <WhatsAppIcon size={18} /> : <MailIcon size={18} />}
              {loading ? "Sending…" : isWa ? "Send on WhatsApp" : "Send order by Email"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
