"use client";

import { PK_CITIES } from "@/lib/validation";

export default function CustomerFields({ value, onChange, errors = {}, emailRequired = false, compact = false }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });

  return (
    <div className="form-grid">
      <div className="field">
        <label className="label" htmlFor="cf-name">Full name <span className="req">*</span></label>
        <input id="cf-name" className="input" autoComplete="name" value={value.customer_name} onChange={set("customer_name")} placeholder="Muhammad Ali" />
        {errors.customer_name && <span className="field-error">{errors.customer_name}</span>}
      </div>
      <div className="field">
        <label className="label" htmlFor="cf-phone">Phone / WhatsApp <span className="req">*</span></label>
        <input id="cf-phone" className="input" type="tel" autoComplete="tel" inputMode="tel" value={value.phone} onChange={set("phone")} placeholder="03XX XXXXXXX" />
        {errors.phone && <span className="field-error">{errors.phone}</span>}
      </div>
      <div className="field">
        <label className="label" htmlFor="cf-email">
          Email {emailRequired ? <span className="req">*</span> : <span className="muted">(optional)</span>}
        </label>
        <input id="cf-email" className="input" type="email" autoComplete="email" value={value.email} onChange={set("email")} placeholder="you@example.com" />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>
      <div className="field">
        <label className="label" htmlFor="cf-city">City <span className="req">*</span></label>
        <input id="cf-city" className="input" list="pk-cities" autoComplete="address-level2" value={value.city} onChange={set("city")} placeholder="Lahore" />
        <datalist id="pk-cities">
          {PK_CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {errors.city && <span className="field-error">{errors.city}</span>}
      </div>
      <div className="field full">
        <label className="label" htmlFor="cf-address">Complete address <span className="req">*</span></label>
        <input id="cf-address" className="input" autoComplete="street-address" value={value.address} onChange={set("address")} placeholder="House #, Street, Area / Sector" />
        {errors.address && <span className="field-error">{errors.address}</span>}
      </div>
      {!compact && (
        <div className="field full">
          <label className="label" htmlFor="cf-notes">Order notes <span className="muted">(optional)</span></label>
          <textarea id="cf-notes" className="textarea" style={{ minHeight: 90 }} value={value.notes} onChange={set("notes")} placeholder="Nearest landmark, preferred delivery time…" />
        </div>
      )}
    </div>
  );
}
