"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SearchIcon } from "../Icons";

export default function ShopControls() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");

  function update(key, value) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/shop${next.toString() ? `?${next}` : ""}`, { scroll: false });
  }

  return (
    <div className="flex gap-12 wrap items-center">
      <form
        className="search-box"
        onSubmit={(e) => {
          e.preventDefault();
          update("q", q.trim());
        }}
      >
        <SearchIcon size={16} />
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shoes…" aria-label="Search products" />
      </form>
      <select
        className="select"
        style={{ height: 42, width: 190, borderRadius: 999 }}
        value={params.get("sort") || ""}
        onChange={(e) => update("sort", e.target.value)}
        aria-label="Sort products"
      >
        <option value="">Sort: Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>
    </div>
  );
}
