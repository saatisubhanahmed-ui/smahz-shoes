"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductImage from "./ProductImage";
import { formatDate, formatPrice } from "@/lib/format";
import { whatsappLink } from "@/lib/site";
import { CheckIcon, ClockIcon, CloseIcon, PackageIcon, SearchIcon, TruckIcon, WhatsAppIcon } from "../Icons";

const STEPS = [
  { id: "pending", label: "Order placed", icon: ClockIcon },
  { id: "confirmed", label: "Confirmed", icon: CheckIcon },
  { id: "processing", label: "Packed", icon: PackageIcon },
  { id: "shipped", label: "Shipped", icon: TruckIcon },
  { id: "delivered", label: "Delivered", icon: CheckIcon },
];

export default function TrackOrder() {
  const params = useSearchParams();
  const router = useRouter();
  const [code, setCode] = useState(params.get("order") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  async function lookup(value) {
    const num = value.trim().toUpperCase();
    if (!num) {
      setError("Please enter your order number");
      return;
    }
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`/api/track?order=${encodeURIComponent(num)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order not found");
      setOrder(data.order);
      router.replace(`/track-order?order=${encodeURIComponent(num)}`, { scroll: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = params.get("order");
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentIdx = order ? STEPS.findIndex((s) => s.id === order.status) : -1;
  const cancelled = order?.status === "cancelled";

  return (
    <>
      <form
        className="track-form"
        onSubmit={(e) => {
          e.preventDefault();
          lookup(code);
        }}
      >
        <input
          className="input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. SMZ-7K3PMX9A"
          aria-label="Order number"
        />
        <button className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : <SearchIcon size={18} />} Track
        </button>
      </form>
      <p className="small muted mt-8">Your order number was shown after ordering and sent to your email / WhatsApp.</p>

      {error && <div className="alert alert-error mt-24" style={{ maxWidth: 620 }}>{error}</div>}

      {order && (
        <div className="card-panel mt-32">
          <div className="flex between wrap gap-16 items-center">
            <div>
              <small className="muted">Order number</small>
              <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--accent-2)" }}>{order.order_number}</div>
              <small className="muted">Placed on {formatDate(order.created_at, true)} · {order.city}</small>
            </div>
            <span className={`status status-${order.status}`} style={{ height: 32, fontSize: 13 }}>{order.status}</span>
          </div>

          {cancelled ? (
            <div className="alert alert-error mt-24 flex items-center gap-12">
              <CloseIcon size={18} /> This order has been cancelled. Contact us on WhatsApp if you think this is a mistake.
            </div>
          ) : (
            <div className="timeline">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = i <= currentIdx;
                return (
                  <div key={s.id} className={`tl-step ${done ? "done" : ""} ${i === currentIdx ? "current" : ""}`}>
                    <span className="tl-dot"><Icon size={18} /></span>
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {order.tracking_note && (
            <div className="alert alert-info mt-16">
              <b>Update from SMAHZ:</b> {order.tracking_note}
            </div>
          )}

          <div className="mt-24">
            {order.items.map((it, i) => (
              <div className="summary-item" key={i}>
                <ProductImage src={it.image} alt={it.name} />
                <div>
                  <b>{it.name}</b>
                  <div className="small muted">Size {it.size || "-"}{it.color ? ` · ${it.color}` : ""} · Qty {it.quantity}</div>
                </div>
                <b>{formatPrice(it.price * it.quantity)}</b>
              </div>
            ))}
            <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
              <div className="sum-row"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="sum-row"><span>Delivery</span><span>{order.shipping ? formatPrice(order.shipping) : "FREE"}</span></div>
              <div className="sum-row total"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>

          <a className="btn btn-wa mt-24" target="_blank" rel="noreferrer" href={whatsappLink(`Hi SMAHZ! I want an update on my order ${order.order_number}.`)}>
            <WhatsAppIcon size={18} /> Ask about this order
          </a>
        </div>
      )}
    </>
  );
}
