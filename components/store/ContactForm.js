"use client";

import { useState } from "react";
import { CheckIcon, MailIcon } from "../Icons";

const empty = { name: "", email: "", phone: "", subject: "", message: "", company: "" };

export default function ContactForm() {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [serverMsg, setServerMsg] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Please enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Please enter a valid email";
    if (form.message.trim().length < 10) e.message = "Message should be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    setServerMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("sent");
      setForm(empty);
    } catch (err) {
      setStatus("error");
      setServerMsg(err.message);
    }
  }

  if (status === "sent") {
    return (
      <div className="success-box" style={{ padding: "32px 0" }}>
        <div className="success-icon">
          <CheckIcon size={40} />
        </div>
        <h3 className="h2" style={{ fontSize: 28 }}>Message sent!</h3>
        <p className="muted mt-8">Thanks for reaching out — we&apos;ll get back to you within 24 hours.</p>
        <button className="btn btn-outline mt-24" onClick={() => setStatus("idle")}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="field">
          <label className="label" htmlFor="c-name">Your name <span className="req">*</span></label>
          <input id="c-name" className="input" value={form.name} onChange={set("name")} placeholder="Muhammad Ali" autoComplete="name" />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>
        <div className="field">
          <label className="label" htmlFor="c-email">Email <span className="req">*</span></label>
          <input id="c-email" className="input" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
        <div className="field">
          <label className="label" htmlFor="c-phone">Phone <span className="muted">(optional)</span></label>
          <input id="c-phone" className="input" type="tel" value={form.phone} onChange={set("phone")} placeholder="03XX XXXXXXX" autoComplete="tel" />
        </div>
        <div className="field">
          <label className="label" htmlFor="c-subject">Subject</label>
          <select id="c-subject" className="select" value={form.subject} onChange={set("subject")}>
            <option value="">Choose a topic</option>
            <option>Order enquiry</option>
            <option>Size help</option>
            <option>Exchange / return</option>
            <option>Wholesale / bulk order</option>
            <option>Other</option>
          </select>
        </div>
        <div className="field full">
          <label className="label" htmlFor="c-message">Message <span className="req">*</span></label>
          <textarea id="c-message" className="textarea" value={form.message} onChange={set("message")} placeholder="How can we help you?" />
          {errors.message && <span className="field-error">{errors.message}</span>}
        </div>
        {/* Honeypot field — hidden from humans, catches spam bots */}
        <input type="text" name="company" value={form.company} onChange={set("company")} tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px" }} aria-hidden="true" />
      </div>

      {status === "error" && <div className="alert alert-error mt-16">{serverMsg}</div>}

      <button type="submit" className="btn btn-primary btn-lg btn-block mt-24" disabled={status === "sending"}>
        {status === "sending" ? <span className="spinner" /> : <MailIcon size={18} />}
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
