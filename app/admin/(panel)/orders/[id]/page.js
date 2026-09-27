"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/components/admin/api";
import { StatusBadge } from "@/components/admin/AdminShell";
import ProductImage from "@/components/store/ProductImage";
import { CHANNEL_LABELS, ORDER_STATUSES, formatDate, formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import { ChevronLeft, PhoneIcon, TrashIcon, WhatsAppIcon } from "@/components/Icons";

function waNumber(phone = "") {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("92")) return d;
  if (d.startsWith("0")) return `92${d.slice(1)}`;
  return `92${d}`;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ status: "", tracking_note: "", admin_note: "", notify: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api(`/api/admin/orders/${id}`)
      .then(({ order }) => {
        setOrder(order);
        setForm({ status: order.status, tracking_note: order.tracking_note || "", admin_note: order.admin_note || "", notify: true });
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const { order: updated, notified } = await api(`/api/admin/orders/${id}`, { method: "PATCH", body: form });
      setOrder(updated);
      setMsg(notified ? "Saved — customer notified by email ✔" : "Saved ✔");
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete order ${order.order_number}? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/orders/${id}`, { method: "DELETE" });
      router.replace("/admin/orders");
    } catch (e) {
      alert(e.message);
    }
  }

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!order) return <p className="muted">Loading order…</p>;

  const waMsg = `Assalam o Alaikum ${order.customer_name}! This is SMAHZ Shoes about your order ${order.order_number} (${formatPrice(order.total)}). `;
  const paymentLabel = site.paymentMethods.find((p) => p.id === order.payment_method)?.label || order.payment_method;

  return (
    <>
      <Link href="/admin/orders" className="link-arrow" style={{ marginBottom: 14, display: "inline-flex" }}>
        <ChevronLeft size={16} /> All orders
      </Link>
      <div className="flex between wrap gap-16 items-center" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="admin-title mono">{order.order_number}</h1>
          <p className="small muted">
            {formatDate(order.created_at, true)} · via {CHANNEL_LABELS[order.channel] || order.channel}
          </p>
        </div>
        <div className="flex gap-8 wrap">
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="admin-grid-2">
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <div className="panel">
            <div className="panel-head"><h3>Items</h3></div>
            <div className="panel-body">
              {order.items.map((it, i) => (
                <div className="summary-item" key={i}>
                  <ProductImage src={it.image} alt={it.name} />
                  <div>
                    <b>{it.name}</b>
                    <div className="small muted">Size {it.size || "-"}{it.color ? ` · ${it.color}` : ""} · {formatPrice(it.price)} × {it.quantity}</div>
                  </div>
                  <b>{formatPrice(it.price * it.quantity)}</b>
                </div>
              ))}
              <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
                <div className="sum-row"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                <div className="sum-row"><span>Delivery</span><span>{order.shipping ? formatPrice(order.shipping) : "FREE"}</span></div>
                <div className="sum-row total"><span>Total ({paymentLabel})</span><span>{formatPrice(order.total)}</span></div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Update order</h3></div>
            <div className="panel-body" style={{ display: "grid", gap: 16 }}>
              <div className="field">
                <label className="label">Status</label>
                <div className="chips">
                  {ORDER_STATUSES.map((s) => (
                    <button key={s.id} type="button" className={`chip ${form.status === s.id ? "active" : ""}`} onClick={() => setForm({ ...form, status: s.id })}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label className="label">Note for customer <span className="muted">(shown on Track Order page)</span></label>
                <input className="input" value={form.tracking_note} onChange={(e) => setForm({ ...form, tracking_note: e.target.value })} placeholder="e.g. Shipped via TCS, tracking #123456" />
              </div>
              <div className="field">
                <label className="label">Private admin note</label>
                <textarea className="textarea" style={{ minHeight: 80 }} value={form.admin_note} onChange={(e) => setForm({ ...form, admin_note: e.target.value })} placeholder="Only visible to you" />
              </div>
              {order.email && (
                <label className="switch">
                  <input type="checkbox" checked={form.notify} onChange={(e) => setForm({ ...form, notify: e.target.checked })} />
                  Email the customer when status changes
                </label>
              )}
              <div className="flex gap-12 items-center wrap">
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? <span className="spinner" /> : null} Save changes
                </button>
                {msg && <span className="small muted">{msg}</span>}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <div className="panel">
            <div className="panel-head"><h3>Customer</h3></div>
            <div className="panel-body">
              <dl className="kv">
                <dt>Name</dt><dd>{order.customer_name}</dd>
                <dt>Phone</dt><dd>{order.phone}</dd>
                {order.email && (<><dt>Email</dt><dd><a href={`mailto:${order.email}`} style={{ color: "var(--accent)" }}>{order.email}</a></dd></>)}
                <dt>City</dt><dd>{order.city}</dd>
                <dt>Address</dt><dd>{order.address}</dd>
                {order.notes && (<><dt>Notes</dt><dd>{order.notes}</dd></>)}
                <dt>Payment</dt><dd>{paymentLabel}</dd>
              </dl>
              <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
                <a className="btn btn-wa btn-block" target="_blank" rel="noreferrer" href={`https://wa.me/${waNumber(order.phone)}?text=${encodeURIComponent(waMsg)}`}>
                  <WhatsAppIcon size={18} /> WhatsApp customer
                </a>
                <a className="btn btn-dark btn-block" href={`tel:${order.phone}`}>
                  <PhoneIcon size={18} /> Call {order.phone}
                </a>
                <button className="btn btn-outline btn-block" onClick={() => window.print()}>
                  Print packing slip
                </button>
              </div>
            </div>
          </div>
          <button className="btn btn-danger" onClick={remove}>
            <TrashIcon size={16} /> Delete order
          </button>
        </div>
      </div>
    </>
  );
}
