"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { CartIcon, CloseIcon, MenuIcon } from "../Icons";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/track-order", label: "Track Order" },
];

export default function Header() {
  const pathname = usePathname();
  const { count, openDrawer, loaded } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/shop" && pathname.startsWith("/product"));

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <div className="flex items-center gap-8">
            <button
              className="icon-btn menu-btn"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <Link href="/" className="logo" aria-label="SMAHZ home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-transparent-sm.png" alt="SMAHZ Shoes" width="88" height="54" />
            </Link>
          </div>

          <nav className="nav" aria-label="Main">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <button className="icon-btn" aria-label="Open cart" onClick={openDrawer}>
              <CartIcon />
              {loaded && count > 0 && <span className="cart-count">{count}</span>}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
