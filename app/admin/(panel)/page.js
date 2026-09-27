"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/components/admin/api";
import OrdersTable from "@/components/admin/OrdersTable";
import { CHANNEL_LABELS, ORDER_STATUSES, formatPrice } from "@/lib/format";

export default function DashboardPage() {
  const [s, setS] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/admin/stats").then(setS).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!s) return <p className="muted">Loading dashboard…</p>;

  const maxRev = Math.max(1, ...s.days.map((d) => d.revenue));
  const pending = s.byStatus.pending || 0;
  const delivered = s.byStatus.delivered || 0;

  return (
    <>
      {s.demoMode && (
        <div className="alert alert-info demo-banner">
          <b>Demo mode:</b> Supabase is not connected, so orders are kept in memory and reset when the server restarts. Add your
          Supabase keys to <code>.env.local</code> and run <code>supabase/schema.sql</code> to save everything permanently.
        </div>
      )}
      {!s.emailReady && (
        <div className="alert alert-error demo-banner">
          <b>Email not configured:</b> add <code>RESEND_API_KEY</code> or <code>GMAIL_USER</code> + <code>GMAIL_APP_PASSWORD</code> to{" "}
          <code>.env.local</code> to receive order &amp; contact emails.
        </div>
      )}

      <h1 className="admin-title" style={{ marginBottom: 20 }}>Welcome back 👋</h1>

      <div className="stat-grid">
        <div className="stat">
          <small>Total revenue</small>
          <b className="accent-text">{formatPrice(s.revenue)}</b>
          <span className="trend">Excluding cancelled orders</span>
        </div>
        <div className="stat">
          <small>Total orders</small>
          <b>{s.total}</b>
          <span className="trend">{delivered} delivered</span>
        </div>
        <div className="stat">
          <small>Pending orders</small>
          <b style={{ color: pending ? "#facc15" : undefined }}>{pending}</b>
          <Link href="/admin/orders?status=pending" className="trend" style={{ color: "var(--accent)" }}>
            Review now →
          </Link>
        </div>
        <div className="stat">
          <small>Products</small>
          <b>{s.productCount}</b>
          <Link href="/admin/products/new" className="trend" style={{ color: "var(--accent)" }}>
            Add product →
          </Link>
        </div>
      </div>

      <div className="admin-grid-2 mt-16">
        <div className="panel">
          <div className="panel-head">
            <h3>Sales — last 14 days</h3>
            <span className="small muted">{formatPrice(s.days.reduce((a, d) => a + d.revenue, 0))}</span>
          </div>
          <div className="panel-body">
            <div className="bars">
              {s.days.map((d) => (
                <div className="bar" key={d.date} title={`${d.date}: ${d.orders} orders · ${formatPrice(d.revenue)}`}>
                  <div className={d.revenue ? "" : "zero"} style={{ height: `${(d.revenue / maxRev) * 100}%` }} />
                  <span>{Number(d.date.slice(8))}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Orders by channel</h3>
          </div>
          <div className="panel-body" style={{ display: "grid", gap: 16 }}>
            {Object.entries(CHANNEL_LABELS).map(([id, label]) => {
              const n = s.byChannel[id] || 0;
              const pct = s.total ? Math.round((n / s.total) * 100) : 0;
              return (
                <div key={id}>
                  <div className="flex between small">
                    <span>{label}</span>
                    <b>{n}</b>
                  </div>
                  <div className="progress">
                    <div style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="flex wrap gap-8 mt-8">
              {ORDER_STATUSES.map((st) => (
                <Link key={st.id} href={`/admin/orders?status=${st.id}`} className={`status status-${st.id}`}>
                  {st.label} · {s.byStatus[st.id] || 0}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel mt-16">
        <div className="panel-head">
          <h3>Recent orders</h3>
          <Link href="/admin/orders" className="link-arrow">View all →</Link>
        </div>
        {s.recent.length === 0 ? (
          <div className="panel-body muted">No orders yet. They&apos;ll appear here as soon as customers order.</div>
        ) : (
          <OrdersTable orders={s.recent} />
        )}
      </div>
    </>
  );
}
