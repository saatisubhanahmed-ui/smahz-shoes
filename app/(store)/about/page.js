import Link from "next/link";
import Reveal from "@/components/store/Reveal";
import { site, whatsappLink } from "@/lib/site";
import { ArrowRight, CashIcon, RefreshIcon, RulerIcon, TruckIcon, WhatsAppIcon } from "@/components/Icons";

export const metadata = {
  title: "About Us",
  description: "The story behind SMAHZ — premium shoes built in Pakistan for people who walk bold.",
};

const SIZE_CHART = [
  ["39", "6", "24.5"],
  ["40", "6.5", "25.0"],
  ["41", "7.5", "25.8"],
  ["42", "8", "26.5"],
  ["43", "9", "27.3"],
  ["44", "10", "28.0"],
  ["45", "11", "28.8"],
];

export default function AboutPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link> / <span>About</span>
          </div>
          <span className="eyebrow">Our story</span>
          <h1 className="h1">
            About <span className="accent-text">SMAHZ</span>
          </h1>
          <div className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container about-grid">
          <Reveal className="about-visual dark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-transparent.png" alt="SMAHZ Shoes" width="1259" height="775" />
          </Reveal>
          <Reveal className="prose" delay={100}>
            <p>
              <b style={{ color: "var(--text)" }}>SMAHZ was built on one idea:</b> the shoes you wear should help you move first,
              not hold you back. We&apos;re a Pakistan-based brand designing everyday sneakers, runners and formal shoes that pair
              bold style with all-day comfort — without the import price tag.
            </p>
            <p>
              Every pair we sell is picked for quality that holds up to daily wear — whether you&apos;re commuting across the
              city, heading to class, hitting the gym or dressing up for a wedding. We keep our lineup tight and considered
              rather than overwhelming, so every product on SMAHZ earns its place.
            </p>
            <p>
              We ship nationwide with Cash on Delivery, and we&apos;re always a message away on WhatsApp if you need help picking
              a size or want to know more about a product before you order.
            </p>
            <div className="info-cards mt-32">
              <div className="info-card">
                <small>Based in</small>
                <b>Pakistan</b>
              </div>
              <div className="info-card">
                <small>Delivery</small>
                <b>Nationwide</b>
              </div>
              <div className="info-card">
                <small>Support</small>
                <b>WhatsApp &amp; Email</b>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <span className="eyebrow">What we stand for</span>
              <h2 className="h2">The SMAHZ promise</h2>
            </div>
          </Reveal>
          <div className="values">
            {[
              ["01", "Quality first", "Every pair is checked before it's packed — stitching, sole and sizing."],
              ["02", "Honest prices", "Premium look and feel at prices that make sense for Pakistan."],
              ["03", "Real support", "Talk to a real person on WhatsApp before and after you buy."],
              ["04", "Easy exchange", "Wrong size? Exchange within 7 days, no stress."],
            ].map(([n, t, d], i) => (
              <Reveal key={n} delay={i * 80}>
                <div className="value-num accent-text">{n}</div>
                <h3 className="h3 mt-16">{t}</h3>
                <p className="muted mt-8">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="policies">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <span className="eyebrow">Good to know</span>
              <h2 className="h2">Delivery, exchange &amp; sizing</h2>
            </div>
          </Reveal>
          <div className="feature-grid">
            <Reveal className="feature">
              <div className="ic"><TruckIcon size={24} /></div>
              <h3>Delivery</h3>
              <p>
                We deliver all over Pakistan in 2–5 business days. Delivery charge is Rs {site.shipping.flat}, and FREE on orders of
                Rs {site.shipping.freeAbove.toLocaleString("en-PK")} or more.
              </p>
            </Reveal>
            <Reveal className="feature" delay={100}>
              <div className="ic"><CashIcon size={24} /></div>
              <h3>Payment</h3>
              <p>Cash on Delivery is available everywhere. You can also pay in advance by bank transfer, Easypaisa or JazzCash.</p>
            </Reveal>
            <Reveal className="feature" delay={200}>
              <div className="ic"><RefreshIcon size={24} /></div>
              <h3>Exchange policy</h3>
              <p>
                Size not right? Message us within 7 days of delivery. Shoes must be unworn and in original packaging. One free size
                exchange per order.
              </p>
            </Reveal>
          </div>

          <Reveal className="card-panel mt-32" id="size-guide">
            <div className="flex items-center gap-12" style={{ marginBottom: 18 }}>
              <span className="icon-btn" style={{ color: "var(--accent)" }}>
                <RulerIcon size={18} />
              </span>
              <div>
                <h3 className="h3">Size guide</h3>
                <p className="small muted">Measure your foot heel-to-toe and pick the closest length.</p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>EU size</th>
                    <th>UK size</th>
                    <th>Foot length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_CHART.map(([eu, uk, cm]) => (
                    <tr key={eu}>
                      <td><b>{eu}</b></td>
                      <td>{uk}</td>
                      <td>{cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal className="cta-wa mt-48">
            <div>
              <h3 className="h2" style={{ fontSize: 28 }}>Ready to step in?</h3>
              <p className="muted mt-8">Browse the collection or ask us anything on WhatsApp.</p>
            </div>
            <div className="flex gap-12 wrap">
              <Link href="/shop" className="btn btn-primary btn-lg">
                Shop now <ArrowRight size={18} />
              </Link>
              <a href={whatsappLink()} className="btn btn-wa btn-lg" target="_blank" rel="noreferrer">
                <WhatsAppIcon size={18} /> WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
