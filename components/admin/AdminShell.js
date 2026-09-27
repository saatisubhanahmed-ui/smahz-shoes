"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "./api";
import { ExternalIcon, GridIcon, InboxIcon, LogoutIcon, MenuIcon, OrdersIcon, PackageIcon, TagIcon } from "../Icons";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: GridIcon },
  { href: "/admin/orders", label: "Orders", icon: OrdersIcon, badge: "pending" },
  { href: "/admin/products", label: "Products", icon: PackageIcon },
  { href: "/admin/categories", label: "Categories", icon: TagIcon },
  { href: "/admin/messages", label: "Messages", icon: InboxIcon, badge: "messages" },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [badges, setBadges] = useState({});

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    api("/api/admin/stats")
      .then((s) => setBadges({ pending: s.byStatus?.pending || 0, messages: s.unreadMessages || 0 }))
      .catch(() => {});
  }, [pathname]);

  const active = (href) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const current = LINKS.find((l) => active(l.href));

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <div className="admin-shell dark">
      <aside className={`admin-side ${open ? "open" : ""}`}>
        <Link href="/admin" className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-transparent-sm.png" alt="SMAHZ" width="91" height="56" />
        </Link>
        {LINKS.map(({ href, label, icon: Icon, badge }) => (
          <Link key={href} href={href} className={`admin-link ${active(href) ? "active" : ""}`}>
            <Icon size={18} /> {label}
            {badge && badges[badge] > 0 && <span className="count">{badges[badge]}</span>}
          </Link>
        ))}
        <div style={{ marginTop: "auto", display: "grid", gap: 6 }}>
          <a href="/" target="_blank" rel="noreferrer" className="admin-link">
            <ExternalIcon size={18} /> View store
          </a>
          <button className="admin-link" style={{ background: "none", border: 0, textAlign: "left" }} onClick={logout}>
            <LogoutIcon size={18} /> Log out
          </button>
        </div>
      </aside>
      {open && <div className="overlay" style={{ zIndex: 70 }} onClick={() => setOpen(false)} />}

      <div className="admin-main">
        <div className="admin-top">
          <div className="flex items-center gap-12">
            <button className="icon-btn admin-mobile-bar" onClick={() => setOpen(true)} aria-label="Open menu">
              <MenuIcon size={18} />
            </button>
            <b style={{ fontFamily: "var(--font-head)", fontSize: 17 }}>{current?.label || "Admin"}</b>
          </div>
          <span className="small muted">SMAHZ Admin</span>
        </div>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{status}</span>;
}
