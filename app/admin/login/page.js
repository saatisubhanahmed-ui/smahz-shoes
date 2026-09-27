"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      const next = params.get("next");
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <form className="login-card" onSubmit={submit}>
      <div className="logo" style={{ display: "block", textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-transparent-sm.png" alt="SMAHZ" width="156" height="96" />
      </div>
      <h1 className="h3 text-center">Admin Panel</h1>
      <p className="small muted text-center" style={{ marginBottom: 24 }}>Sign in to manage orders and products</p>

      <div style={{ display: "grid", gap: 14 }}>
        <div className="field">
          <label className="label" htmlFor="u">Username</label>
          <input id="u" className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </div>
        <div className="field">
          <label className="label" htmlFor="p">Password</label>
          <input id="p" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
        </div>
      </div>

      {error && <div className="alert alert-error mt-16">{error}</div>}

      <button className="btn btn-primary btn-block btn-lg mt-24" disabled={loading}>
        {loading ? <span className="spinner" /> : null} {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="small muted text-center mt-16">
        <a href="/">← Back to store</a>
      </p>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="login-page dark">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
