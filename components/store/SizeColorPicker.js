"use client";

import { RulerIcon } from "../Icons";

export default function SizeColorPicker({ product, size, setSize, color, setColor, shake }) {
  return (
    <>
      {product.sizes?.length > 0 && (
        <>
          <div className="opt-label">
            <span>
              Size (EU) {size && <span style={{ color: "var(--accent-2)" }}>— {size}</span>}
            </span>
            <a href="/about#size-guide" className="muted small flex items-center gap-8" target="_blank" rel="noreferrer">
              <RulerIcon size={14} /> Size guide
            </a>
          </div>
          <div className={`size-grid ${shake ? "shake" : ""}`}>
            {product.sizes.map((s) => (
              <button key={s} type="button" className={`size-btn ${size === s ? "active" : ""}`} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>
        </>
      )}

      {product.colors?.length > 0 && (
        <>
          <div className="opt-label">
            <span>
              Color {color && <span style={{ color: "var(--accent-2)" }}>— {color}</span>}
            </span>
          </div>
          <div className="chips">
            {product.colors.map((c) => (
              <button key={c} type="button" className={`chip ${color === c ? "active" : ""}`} onClick={() => setColor(c)}>
                {c}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
