import Link from "next/link";

export default function NotFound() {
  return (
    <div className="login-page dark">
      <div className="text-center" style={{ maxWidth: 480 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-transparent-sm.png" alt="SMAHZ" width="200" height="123" style={{ margin: "0 auto 24px" }} />
        <div className="h-display accent-text">404</div>
        <h1 className="h3 mt-16">This page took a wrong step.</h1>
        <p className="muted mt-8">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="flex gap-12 mt-32" style={{ justifyContent: "center" }}>
          <Link href="/" className="btn btn-primary">Go home</Link>
          <Link href="/shop" className="btn btn-outline">Shop shoes</Link>
        </div>
      </div>
    </div>
  );
}
