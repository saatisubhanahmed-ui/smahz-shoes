"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/api";
import { formatDate } from "@/lib/format";
import { MailIcon, TrashIcon, WhatsAppIcon } from "@/components/Icons";

function waNumber(phone = "") {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("92") ? d : d.startsWith("0") ? `92${d.slice(1)}` : `92${d}`;
}

export default function MessagesPage() {
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/admin/messages").then((d) => setList(d.messages)).catch((e) => setError(e.message));
  }, []);

  async function markRead(m, is_read) {
    setList((l) => l.map((x) => (x.id === m.id ? { ...x, is_read } : x)));
    api(`/api/admin/messages/${m.id}`, { method: "PATCH", body: { is_read } }).catch(() => {});
  }

  async function remove(m) {
    if (!confirm("Delete this message?")) return;
    await api(`/api/admin/messages/${m.id}`, { method: "DELETE" }).catch((e) => alert(e.message));
    setList((l) => l.filter((x) => x.id !== m.id));
  }

  const shown = (list || []).filter((m) => (filter === "unread" ? !m.is_read : true));

  return (
    <>
      <div className="flex between wrap gap-16 items-center" style={{ marginBottom: 20 }}>
        <h1 className="admin-title">Messages</h1>
        <div className="chips">
          <button className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
          <button className={`chip ${filter === "unread" ? "active" : ""}`} onClick={() => setFilter("unread")}>
            Unread ({(list || []).filter((m) => !m.is_read).length})
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {!list && <p className="muted">Loading…</p>}
      {list && shown.length === 0 && <div className="panel"><div className="panel-body muted">No messages here.</div></div>}

      <div style={{ display: "grid", gap: 12 }}>
        {shown.map((m) => (
          <div key={m.id} className="panel" style={{ borderColor: m.is_read ? undefined : "rgba(var(--accent-rgb), .45)" }}>
            <div className="panel-head">
              <div>
                <h3 className="flex items-center gap-8">
                  {!m.is_read && <span className="dot-live" />} {m.name}
                  {m.subject && <span className="badge">{m.subject}</span>}
                </h3>
                <div className="small muted">
                  {m.email}
                  {m.phone ? ` · ${m.phone}` : ""} · {formatDate(m.created_at, true)}
                </div>
              </div>
              <div className="flex gap-8 wrap">
                <a className="btn btn-dark btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + (m.subject || "Your message to SMAHZ"))}`} onClick={() => markRead(m, true)}>
                  <MailIcon size={14} /> Reply
                </a>
                {m.phone && (
                  <a className="btn btn-wa btn-sm" target="_blank" rel="noreferrer" href={`https://wa.me/${waNumber(m.phone)}`} onClick={() => markRead(m, true)}>
                    <WhatsAppIcon size={14} /> WhatsApp
                  </a>
                )}
                <button className="btn btn-outline btn-sm" onClick={() => markRead(m, !m.is_read)}>
                  Mark {m.is_read ? "unread" : "read"}
                </button>
                <button className="icon-btn" onClick={() => remove(m)} title="Delete"><TrashIcon size={15} /></button>
              </div>
            </div>
            <div className="panel-body" style={{ whiteSpace: "pre-wrap", color: "var(--text-2)" }}>{m.message}</div>
          </div>
        ))}
      </div>
    </>
  );
}
