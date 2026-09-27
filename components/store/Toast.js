"use client";

import { useCart } from "./CartProvider";
import { CheckIcon } from "../Icons";

export default function Toast() {
  const { toast } = useCart();
  if (!toast) return null;
  return (
    <div className="toast" role="status">
      <CheckIcon size={16} /> {toast}
    </div>
  );
}
