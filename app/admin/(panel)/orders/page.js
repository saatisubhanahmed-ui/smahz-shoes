"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { api } from "@/components/admin/api";
import OrdersTable from "@/components/admin/OrdersTable";
import { CHANNEL_LABELS, ORDER_STATUSES } from "@/lib/format";
import { SearchIcon } from "@/components/Icons";

function OrdersInner() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get("status") || "";
  const channel = params.get("channel") || "";
  const q = params.get("q") || "";
  const page = parseInt(params.get("page") || "1", 10);

  const [search, setSearch] = useState(q);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const setParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      router.push(`/admin/orders${next.toString() ? `?${next}` : ""}`);
    },
    [params, router]
  );

  useEffect(() => {
    setData(null);
    const qs = new URLSearchParams({ ...(status && { status }), ...(channel && { channel }), ...(q && { q }), page: String(page) });
    api(`/api/admin/orders?${qs}`).then(setData).catch((e) => setError(e.message));
  }, [status, channel, q, page]);

  const pages = data ? Math.max(1, Math.ceil(data.count / 20)) : 1;

  return (
    <>
      <div className="flex between wrap gap-16 items-center" style={{ marginBottom: 20 }}>
        <h1 className="admin-title">Orders</h1>
        <div className="flex gap-12 wrap">
          <form
            className="search-box"
            onSubmit={(e) => {
              e.preventDefault();
              setParam("q", search.trim());
            }}
          >
            <SearchIcon size={16} />
            <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order #, name, phone, city" />
          </form>
          <select className="select" style={{ height: 42, width: 180, borderRadius: 999 }} value={channel} onChange={(e) => setParam("channel", e.target.value)}>
            <option value="">All channels</option>
            {Object.entries(CHANNEL_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="chips" style={{ marginBottom: 16 }}>
        <button className={`chip ${!status ? "active" : ""}`} onClick={() => setParam("status", "")}>All</button>
        {ORDER_STATUSES.map((s) => (
          <button key={s.id} className={`chip ${status === s.id ? "active" : ""}`} onClick={() => setParam("status", s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel">
        {!data ? (
          <div className="panel-body muted">Loading orders…</div>
        ) : data.rows.length === 0 ? (
          <div className="panel-body muted">No orders found.</div>
        ) : (
          <>
            <OrdersTable orders={data.rows} />
            <div className="pagination">
              <span>
                {data.count} order{data.count === 1 ? "" : "s"} · Page {page} of {pages}
              </span>
              <button className="btn btn-dark btn-sm" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>
                Prev
              </button>
              <button className="btn btn-dark btn-sm" disabled={page >= pages} onClick={() => setParam("page", String(page + 1))}>
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersInner />
    </Suspense>
  );
}
