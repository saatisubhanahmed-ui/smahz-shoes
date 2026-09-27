"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./AdminShell";
import { CHANNEL_LABELS, formatDate, formatPrice } from "@/lib/format";

export default function OrdersTable({ orders }) {
  const router = useRouter();
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>City</th>
            <th>Items</th>
            <th>Total</th>
            <th>Via</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/admin/orders/${o.id}`)}>
              <td><Link href={`/admin/orders/${o.id}`} className="mono" style={{ color: "var(--accent-2)", fontWeight: 700 }}>{o.order_number}</Link></td>
              <td>
                <b>{o.customer_name}</b>
                <div className="small muted">{o.phone}</div>
              </td>
              <td>{o.city}</td>
              <td>{o.items?.reduce((a, i) => a + i.quantity, 0)}</td>
              <td><b>{formatPrice(o.total)}</b></td>
              <td><span className="channel-tag">{CHANNEL_LABELS[o.channel] || o.channel}</span></td>
              <td><StatusBadge status={o.status} /></td>
              <td className="small muted" style={{ whiteSpace: "nowrap" }}>{formatDate(o.created_at, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
