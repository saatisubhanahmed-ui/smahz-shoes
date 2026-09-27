"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/components/admin/api";
import ProductImage from "@/components/store/ProductImage";
import { formatPrice } from "@/lib/format";
import { EditIcon, ExternalIcon, PlusIcon, SearchIcon, TrashIcon } from "@/components/Icons";

export default function ProductsPage() {
  const [products, setProducts] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = () =>
    api("/api/admin/products")
      .then((d) => {
        setProducts(d.products);
        setDemoMode(Boolean(d.demoMode));
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (products || []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase())),
    [products, q]
  );

  async function toggle(p, field) {
    const value = !p[field];
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, [field]: value } : x)));
    try {
      await api(`/api/admin/products/${p.id}`, { method: "PATCH", body: { [field]: value } });
    } catch (e) {
      alert(e.message);
      load();
    }
  }

  async function remove(p) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/products/${p.id}`, { method: "DELETE" });
      setProducts((list) => list.filter((x) => x.id !== p.id));
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <>
      {demoMode && (
        <div className="alert alert-info demo-banner">
          Showing demo products. Connect Supabase (see README) to add, edit and delete your own products.
        </div>
      )}
      <div className="flex between wrap gap-16 items-center" style={{ marginBottom: 20 }}>
        <h1 className="admin-title">Products {products && <span className="muted" style={{ fontSize: 18 }}>({products.length})</span>}</h1>
        <div className="flex gap-12 wrap">
          <div className="search-box">
            <SearchIcon size={16} />
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" />
          </div>
          <Link href="/admin/products/new" className="btn btn-primary">
            <PlusIcon size={18} /> Add product
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel">
        {!products ? (
          <div className="panel-body muted">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="panel-body muted">No products yet. Click “Add product” to create your first one.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Featured</th>
                  <th>Visible</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td><ProductImage src={p.images?.[0]} alt="" className="thumb" /></td>
                    <td>
                      <b>{p.name}</b>
                      <div className="small muted">{p.sizes?.join(", ") || "No sizes"}</div>
                    </td>
                    <td>{p.category?.name || <span className="muted">—</span>}</td>
                    <td>
                      <b>{formatPrice(p.price)}</b>
                      {p.compare_at_price ? <div className="small muted" style={{ textDecoration: "line-through" }}>{formatPrice(p.compare_at_price)}</div> : null}
                    </td>
                    <td>
                      <span style={{ color: p.stock <= 0 ? "var(--red)" : p.stock < 10 ? "#facc15" : undefined }}>{p.stock}</span>
                    </td>
                    <td>
                      <label className="switch"><input type="checkbox" checked={Boolean(p.is_featured)} onChange={() => toggle(p, "is_featured")} disabled={demoMode} /></label>
                    </td>
                    <td>
                      <label className="switch"><input type="checkbox" checked={Boolean(p.is_active)} onChange={() => toggle(p, "is_active")} disabled={demoMode} /></label>
                    </td>
                    <td>
                      <div className="flex gap-8" style={{ justifyContent: "flex-end" }}>
                        <a className="icon-btn" href={`/product/${p.slug}`} target="_blank" rel="noreferrer" title="View in store"><ExternalIcon size={16} /></a>
                        <Link className="icon-btn" href={`/admin/products/${p.id}`} title="Edit"><EditIcon size={16} /></Link>
                        <button className="icon-btn" onClick={() => remove(p)} title="Delete" disabled={demoMode}><TrashIcon size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
