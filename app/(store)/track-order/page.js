import Link from "next/link";
import { Suspense } from "react";
import TrackOrder from "@/components/store/TrackOrder";

export const metadata = {
  title: "Track Your Order",
  description: "Enter your SMAHZ order number to see the live status of your delivery.",
};

export default function TrackOrderPage() {
  return (
    <>
      <section className="page-head">
        <div className="container container-sm">
          <div className="breadcrumbs">
            <Link href="/">Home</Link> / <span>Track Order</span>
          </div>
          <span className="eyebrow">Order status</span>
          <h1 className="h1">Track Your Order</h1>
          <p className="lead">Enter the order number you received after placing your order.</p>
          <div className="rule" />
        </div>
      </section>
      <section className="section-sm" style={{ minHeight: 420 }}>
        <div className="container container-sm">
          <Suspense>
            <TrackOrder />
          </Suspense>
        </div>
      </section>
    </>
  );
}
