"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { slugify } from "@/lib/format";
import { ChevronLeft, UploadIcon } from "../Icons";

const DEFAULT_SIZES = "39, 40, 41, 42, 43, 44";

const blank = {
  name: "",
  slug: "",
  description: "",
  price: "",
  compare_at_price: "",
  category_id: "",
  images: [],
  sizes: DEFAULT_SIZES,
  colors: "",
  stock: 20,
  is_featured: false,
  is_active: true,
};

export default function ProductForm({ productId }) {
  const router = useRouter();
  const isEdit = Boolean(productId);
  const [form, setForm] = useState(blank);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const fileRef = useRef(null);

  useEffect(() => {
    api("/api/admin/categories").then((d) => setCategories(d.categories)).catch(() => {});
    if (isEdit) {
      api(`/api/admin/products/${productId}`)
        .then(({ product: p }) => {
          setForm({
            ...blank,
            ...p,
            description: p.description || "",
            compare_at_price: p.compare_at_price || "",
            category_id: p.category_id || "",
            sizes: (p.sizes || []).join(", "),
            colors: (p.colors || []).join(", "),
          });
          setLoading(false);
        })
        .catch((e) => {
          setError(e.message);
          setLoading(false);
        });
    }
  }, [isEdit, productId]);

  const set = (k) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: value };
      if (k === "name" && !slugTouched) next.slug = slugify(value);
      return next;
    });
  };

  async function uploadFiles(files) {
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const { url } = await api("/api/admin/upload", { method: "POST", form: fd });
        setForm((f) => ({ ...f, images: [...f.images, url] }));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addUrl() {
    const u = urlInput.trim();
    if (!/^https?:\/\//.test(u)) return setError("Image URL must start with http:// or https://");
    setForm((f) => ({ ...f, images: [...f.images, u] }));
    setUrlInput("");
    setError("");
  }

  function moveImage(i, dir) {
    setForm((f) => {
      const imgs = [...f.images];
      const j = i + dir;
      if (j < 0 || j >= imgs.length) return f;
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
      return { ...f, images: imgs };
    });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Product name is required");
    if (!form.price || Number(form.price) <= 0) return setError("Please enter a valid price");
    setSaving(true);
    try {
      const body = { ...form, category_id: form.category_id || null };
      delete body.category;
      delete body.id;
      delete body.created_at;
      delete body.updated_at;
      if (isEdit) await api(`/api/admin/products/${productId}`, { method: "PATCH", body });
      else await api("/api/admin/products", { method: "POST", body });
      router.push("/admin/products");
      router.refresh();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  if (loading) return <p className="muted">Loading product…</p>;

  return (
    <form onSubmit={submit}>
      <Link href="/admin/products" className="link-arrow" style={{ marginBottom: 14, display: "inline-flex" }}>
        <ChevronLeft size={16} /> All products
      </Link>
      <div className="flex between wrap gap-16 items-center" style={{ marginBottom: 20 }}>
        <h1 className="admin-title">{isEdit ? "Edit product" : "Add new product"}</h1>
        <button className="btn btn-primary" disabled={saving || uploading}>
          {saving ? <span className="spinner" /> : null} {isEdit ? "Save changes" : "Publish product"}
        </button>
      </div>

      {error && <div className="alert alert-error demo-banner">{error}</div>}

      <div className="admin-grid-2">
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <div className="panel">
            <div className="panel-head"><h3>Details</h3></div>
            <div className="panel-body form-grid">
              <div className="field full">
                <label className="label">Product name <span className="req">*</span></label>
                <input className="input" value={form.name} onChange={set("name")} placeholder="SMAHZ Aero Runner" />
              </div>
              <div className="field full">
                <label className="label">URL slug</label>
                <input
                  className="input mono"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
                  }}
                  placeholder="smahz-aero-runner"
                />
                <span className="small muted">yourwebsite.com/product/{form.slug || "…"}</span>
              </div>
              <div className="field full">
                <label className="label">Description</label>
                <textarea className="textarea" value={form.description} onChange={set("description")} placeholder="Materials, comfort, what it's great for…" />
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Images</h3>
              <span className="small muted">First image is the main photo</span>
            </div>
            <div className="panel-body">
              <div className="img-uploader">
                {form.images.map((src, i) => (
                  <div className="img-slot" key={src + i}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" />
                    <button type="button" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} aria-label="Remove image">×</button>
                    <div style={{ position: "absolute", bottom: 4, left: 4, display: "flex", gap: 4 }}>
                      {i > 0 && <button type="button" style={{ position: "static" }} onClick={() => moveImage(i, -1)} aria-label="Move left">‹</button>}
                      {i < form.images.length - 1 && <button type="button" style={{ position: "static" }} onClick={() => moveImage(i, 1)} aria-label="Move right">›</button>}
                    </div>
                  </div>
                ))}
                <label className="img-add">
                  {uploading ? <span className="spinner" /> : (<span><UploadIcon size={20} /><br />Upload</span>)}
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => uploadFiles([...e.target.files])} />
                </label>
              </div>
              <div className="flex gap-8 mt-16">
                <input className="input" style={{ height: 42 }} value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="…or paste an image URL" />
                <button type="button" className="btn btn-dark btn-sm" style={{ height: 42 }} onClick={addUrl}>Add</button>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Variants</h3></div>
            <div className="panel-body form-grid">
              <div className="field full">
                <label className="label">Sizes <span className="muted">(comma separated)</span></label>
                <input className="input" value={form.sizes} onChange={set("sizes")} placeholder={DEFAULT_SIZES} />
              </div>
              <div className="field full">
                <label className="label">Colors <span className="muted">(comma separated, optional)</span></label>
                <input className="input" value={form.colors} onChange={set("colors")} placeholder="Black, White" />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <div className="panel">
            <div className="panel-head"><h3>Pricing (PKR)</h3></div>
            <div className="panel-body" style={{ display: "grid", gap: 14 }}>
              <div className="field">
                <label className="label">Price <span className="req">*</span></label>
                <input className="input" type="number" min="0" value={form.price} onChange={set("price")} placeholder="4999" />
              </div>
              <div className="field">
                <label className="label">Compare-at price <span className="muted">(old price, optional)</span></label>
                <input className="input" type="number" min="0" value={form.compare_at_price} onChange={set("compare_at_price")} placeholder="6499" />
              </div>
              <div className="field">
                <label className="label">Stock quantity</label>
                <input className="input" type="number" min="0" value={form.stock} onChange={set("stock")} />
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Organize</h3></div>
            <div className="panel-body" style={{ display: "grid", gap: 16 }}>
              <div className="field">
                <label className="label">Category</label>
                <select className="select" value={form.category_id} onChange={set("category_id")}>
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Link href="/admin/categories" className="small" style={{ color: "var(--accent)" }}>+ Manage categories</Link>
              </div>
              <label className="switch">
                <input type="checkbox" checked={form.is_active} onChange={set("is_active")} /> Visible in store
              </label>
              <label className="switch">
                <input type="checkbox" checked={form.is_featured} onChange={set("is_featured")} /> Featured (Best Sellers)
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
