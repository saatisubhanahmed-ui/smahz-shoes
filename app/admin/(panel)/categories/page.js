"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/api";
import ProductImage from "@/components/store/ProductImage";
import { EditIcon, TrashIcon } from "@/components/Icons";

const blank = { name: "", description: "", image_url: "", sort_order: 0 };

export default function CategoriesPage() {
  const [list, setList] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    api("/api/admin/categories")
      .then((d) => {
        setList(d.categories);
        setDemoMode(Boolean(d.demoMode));
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) await api(`/api/admin/categories/${editingId}`, { method: "PATCH", body: form });
      else await api("/api/admin/categories", { method: "POST", body: form });
      setForm(blank);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(c) {
    if (!confirm(`Delete category "${c.name}"? Products in it will become uncategorised.`)) return;
    try {
      await api(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      {demoMode && <div className="alert alert-info demo-banner">Showing demo categories. Connect Supabase to manage your own.</div>}
      <h1 className="admin-title" style={{ marginBottom: 20 }}>Categories</h1>

      <div className="admin-grid-2">
        <div className="panel">
          {!list ? (
            <div className="panel-body muted">Loading…</div>
          ) : list.length === 0 ? (
            <div className="panel-body muted">No categories yet — create your first one.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Products</th>
                    <th>Order</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id}>
                      <td><ProductImage src={c.image_url} alt="" className="thumb" /></td>
                      <td>
                        <b>{c.name}</b>
                        <div className="small muted mono">/{c.slug}</div>
                      </td>
                      <td>{c.product_count}</td>
                      <td>{c.sort_order}</td>
                      <td>
                        <div className="flex gap-8" style={{ justifyContent: "flex-end" }}>
                          <button
                            className="icon-btn"
                            title="Edit"
                            onClick={() => {
                              setEditingId(c.id);
                              setForm({ name: c.name, description: c.description || "", image_url: c.image_url || "", sort_order: c.sort_order || 0 });
                            }}
                          >
                            <EditIcon size={16} />
                          </button>
                          <button className="icon-btn" title="Delete" onClick={() => remove(c)} disabled={demoMode}>
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form className="panel" onSubmit={submit} style={{ alignSelf: "start" }}>
          <div className="panel-head">
            <h3>{editingId ? "Edit category" : "New category"}</h3>
            {editingId && (
              <button type="button" className="btn btn-dark btn-sm" onClick={() => { setEditingId(null); setForm(blank); }}>
                Cancel
              </button>
            )}
          </div>
          <div className="panel-body" style={{ display: "grid", gap: 14 }}>
            <div className="field">
              <label className="label">Name <span className="req">*</span></label>
              <input className="input" value={form.name} onChange={set("name")} placeholder="Sneakers" required />
            </div>
            <div className="field">
              <label className="label">Short description</label>
              <input className="input" value={form.description} onChange={set("description")} placeholder="Street-ready everyday sneakers" />
            </div>
            <div className="field">
              <label className="label">Cover image URL</label>
              <input className="input" value={form.image_url} onChange={set("image_url")} placeholder="https://…" />
              <span className="small muted">Tip: upload a photo on a product, then copy its URL here.</span>
            </div>
            <div className="field">
              <label className="label">Display order</label>
              <input className="input" type="number" value={form.sort_order} onChange={set("sort_order")} />
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <button className="btn btn-primary" disabled={saving || demoMode}>
              {saving ? <span className="spinner" /> : null} {editingId ? "Save category" : "Add category"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
