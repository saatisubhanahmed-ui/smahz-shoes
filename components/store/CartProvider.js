"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { calcShipping } from "@/lib/site";

const CartContext = createContext(null);
const STORAGE_KEY = "smahz_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickView, setQuickView] = useState(null);
  const [toast, setToast] = useState(null);
  // AI assistant: { id, start } — changing the id asks the widget to open (and optionally start ordering)
  const [assistantRequest, setAssistantRequest] = useState(null);
  const toastTimer = useRef(null);

  // Load saved cart
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setItems(saved);
    } catch {}
    setLoaded(true);
  }, []);

  // Persist cart
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  // Lock page scroll while drawer / modal is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen || quickView ? "hidden" : "";
  }, [drawerOpen, quickView]);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const addItem = useCallback((product, { size, color, quantity = 1, silent = false } = {}) => {
    const key = `${product.id}__${size || ""}__${color || ""}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(i.quantity + quantity, 20) } : i));
      }
      return [
        ...prev,
        {
          key,
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0] || "",
          price: product.price,
          size: size || "",
          color: color || "",
          quantity,
        },
      ];
    });
    setQuickView(null);
    if (!silent) setDrawerOpen(true);
  }, []);

  const updateQty = useCallback((key, quantity) => {
    setItems((prev) =>
      quantity <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(quantity, 20) } : i))
    );
  }, []);

  const removeItem = useCallback((key) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = calcShipping(subtotal);
    return {
      items,
      loaded,
      count,
      subtotal,
      shipping,
      total: subtotal + shipping,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      quickView,
      openQuickView: setQuickView,
      closeQuickView: () => setQuickView(null),
      toast,
      showToast,
      assistantRequest,
      openAssistant: (start) => {
        setDrawerOpen(false);
        setAssistantRequest({ id: Date.now(), start: start || null });
      },
    };
  }, [items, loaded, drawerOpen, quickView, toast, assistantRequest, addItem, updateQty, removeItem, clearCart, showToast]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/** Plain-text order summary used for WhatsApp / email messages */
export function buildOrderText({ items, subtotal, shipping, total }, customer, orderNumber) {
  const lines = [];
  lines.push("*SMAHZ Shoes — New Order*");
  if (orderNumber) lines.push(`Order #: ${orderNumber}`);
  lines.push("");
  items.forEach((i, n) => {
    lines.push(`${n + 1}. ${i.name}`);
    lines.push(`   Size: ${i.size || "-"}${i.color ? ` | Color: ${i.color}` : ""} | Qty: ${i.quantity}`);
    lines.push(`   Rs ${(i.price * i.quantity).toLocaleString("en-PK")}`);
  });
  lines.push("");
  lines.push(`Subtotal: Rs ${subtotal.toLocaleString("en-PK")}`);
  lines.push(`Delivery: ${shipping ? "Rs " + shipping.toLocaleString("en-PK") : "FREE"}`);
  lines.push(`*Total: Rs ${total.toLocaleString("en-PK")}*`);
  if (customer) {
    lines.push("");
    lines.push("*Customer details*");
    lines.push(`Name: ${customer.customer_name}`);
    lines.push(`Phone: ${customer.phone}`);
    lines.push(`City: ${customer.city}`);
    lines.push(`Address: ${customer.address}`);
    if (customer.notes) lines.push(`Notes: ${customer.notes}`);
  }
  return lines.join("\n");
}
