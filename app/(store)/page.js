import Link from "next/link";
import HeroVideo from "@/components/store/HeroVideo";
import ProductCard from "@/components/store/ProductCard";
import ProductImage from "@/components/store/ProductImage";
import Reveal from "@/components/store/Reveal";
import { getCategories, getProducts } from "@/lib/data";
import { discountPercent } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";
import {
  ArrowRight,
  ArrowUpRight,
  CartIcon,
  CashIcon,
  MailIcon,
  PackageIcon,
  RefreshIcon,
  ShieldIcon,
  TruckIcon,
  WhatsAppIcon,
} from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, latest, featured] = await Promise.all([
    getCategories(),
    getProducts({ limit: 8 }),
    getProducts({ featured: true, limit: 4 }),
  ]);
  const maxOff = Math.max(0, ...[...latest, ...featured].map((p) => discountPercent(p.price, p.compare_at_price)));

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="hero dark">
        <HeroVideo />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-badge">
              <span className="dot-live" /> New drop · Nationwide delivery
            </span>
            <h1 className="h-display">
              Walk <span className="accent-text">Bold.</span>
              <br />
              Walk SMAHZ.
            </h1>
            <p className="lead">
              Premium sneakers, runners and formal shoes designed for people who move first — bold style, all-day
              comfort and prices that make sense. Cash on Delivery across Pakistan.
            </p>
            <div className="hero-ctas">
              <Link href="/shop" className="btn btn-primary btn-lg">
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link href="/about" className="btn btn-outline btn-lg">
                Our Story
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <strong>COD</strong>
                <span>All over Pakistan</span>
              </div>
              <div>
                <strong>2–5 days</strong>
                <span>Fast delivery</span>
              </div>
              <div>
                <strong>7 days</strong>
                <span>Easy exchange</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= TRUST STRIP ================= */}
      <div className="trust">
        {[
          [TruckIcon, "Nationwide Delivery", "2–5 business days"],
          [CashIcon, "Cash on Delivery", "Pay at your door"],
          [RefreshIcon, "Easy Exchange", "7-day size exchange"],
          [ShieldIcon, "Quality Checked", "Every pair inspected"],
        ].map(([Icon, title, sub]) => (
          <div className="trust-item" key={title}>
            <Icon size={26} className="ic" />
            <div>
              <b>{title}</b>
              <span>{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ================= CATEGORIES ================= */}
      {categories.length > 0 && (
        <section className="section">
          <div className="container">
            <Reveal className="section-head">
              <div>
                <span className="eyebrow">Shop by category</span>
                <h2 className="h2">Find your fit</h2>
              </div>
              <Link href="/shop" className="link-arrow">
                All products <ArrowRight size={16} />
              </Link>
            </Reveal>
            <div className="cat-grid">
              {categories.slice(0, 4).map((c, i) => (
                <Reveal key={c.id} delay={i * 80}>
                  <Link href={`/shop?category=${c.slug}`} className="cat-tile" style={{ display: "block" }}>
                    <ProductImage src={c.image_url} alt={c.name} />
                    <div className="cat-tile-body">
                      <div>
                        <h3>{c.name}</h3>
                        {c.description && <p>{c.description}</p>}
                      </div>
                      <span className="arrow">
                        <ArrowUpRight size={18} />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= LATEST ARRIVALS ================= */}
      <section className="section section-alt">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <span className="eyebrow">The lineup</span>
              <h2 className="h2">Latest Arrivals</h2>
            </div>
            <Link href="/shop" className="link-arrow">
              View all <ArrowRight size={16} />
            </Link>
          </Reveal>
          {latest.length === 0 ? (
            <div className="empty">No products yet — add your first product from the admin panel.</div>
          ) : (
            <div className="grid-products">
              {latest.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= PROMO ================= */}
      <section className="section">
        <div className="container">
          <Reveal className="promo dark">
            <div>
              <span className="eyebrow">Limited time</span>
              <h2 className="h1" style={{ marginTop: 14 }}>
                The Season Sale <br />
                is <span className="accent-text">live now.</span>
              </h2>
              <p className="lead" style={{ marginTop: 16 }}>
                Selected sneakers and runners at special prices, plus free delivery on orders above Rs{" "}
                {site.shipping.freeAbove.toLocaleString("en-PK")}. While sizes last.
              </p>
              <div className="hero-ctas mt-32">
                <Link href="/shop" className="btn btn-primary btn-lg">
                  Shop the sale <ArrowRight size={18} />
                </Link>
              </div>
            </div>
            <div className="promo-big">
              <span className="accent-text">{maxOff > 0 ? `${maxOff}%` : "NEW"}</span>
              <small>{maxOff > 0 ? "UP TO · OFF" : "SEASON DROP"}</small>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= BEST SELLERS ================= */}
      {featured.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <Reveal className="section-head">
              <div>
                <span className="eyebrow">Customer favourites</span>
                <h2 className="h2">Best Sellers</h2>
              </div>
              <Link href="/shop" className="link-arrow">
                Shop all <ArrowRight size={16} />
              </Link>
            </Reveal>
            <div className="grid-products">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= HOW TO ORDER ================= */}
      <section className="section section-alt">
        <div className="container">
          <Reveal className="text-center" style={{ marginBottom: 44 }}>
            <span className="eyebrow">Order your way</span>
            <h2 className="h2" style={{ marginTop: 10 }}>Three easy ways to order</h2>
            <p className="lead" style={{ margin: "14px auto 0" }}>
              Add your favourite pair to the cart, then pick whatever is easiest for you.
            </p>
          </Reveal>
          <div className="feature-grid">
            <Reveal className="feature" delay={0}>
              <div className="ic" style={{ background: "rgba(37,211,102,.12)", color: "var(--wa)" }}>
                <WhatsAppIcon size={24} />
              </div>
              <h3>1. Send order on WhatsApp</h3>
              <p>Your cart and delivery details are typed out for you — just press send and we confirm in minutes.</p>
            </Reveal>
            <Reveal className="feature" delay={100}>
              <div className="ic">
                <MailIcon size={24} />
              </div>
              <h3>2. Send order on Email</h3>
              <p>Prefer email? Your order goes straight to our inbox and you get a copy with your order number.</p>
            </Reveal>
            <Reveal className="feature" delay={200}>
              <div className="ic">
                <CartIcon size={24} />
              </div>
              <h3>3. Checkout &amp; place order</h3>
              <p>Classic checkout with Cash on Delivery or bank transfer — and a tracking number instantly.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="section">
        <div className="container">
          <div className="feature-grid">
            <Reveal className="feature">
              <div className="ic"><CashIcon size={24} /></div>
              <h3>Cash on Delivery</h3>
              <p>
                Order now, pay when your parcel arrives at your door. Delivery is Rs {site.shipping.flat} — free above Rs{" "}
                {site.shipping.freeAbove.toLocaleString("en-PK")}.
              </p>
            </Reveal>
            <Reveal className="feature" delay={100}>
              <div className="ic"><ShieldIcon size={24} /></div>
              <h3>Online Payment</h3>
              <p>Pay via bank transfer, Easypaisa or JazzCash — we share the details on WhatsApp after confirming.</p>
            </Reveal>
            <Reveal className="feature" delay={200}>
              <div className="ic"><PackageIcon size={24} /></div>
              <h3>Track Every Order</h3>
              <p>Every order gets a tracking number — check your status anytime on the Track Order page.</p>
            </Reveal>
          </div>

          <Reveal className="cta-wa mt-48">
            <div>
              <h3 className="h2" style={{ fontSize: 28 }}>Need help choosing a size?</h3>
              <p className="muted mt-8">Message us on WhatsApp — a real person replies, usually within minutes.</p>
            </div>
            <a className="btn btn-wa btn-lg" href={whatsappLink("Hi SMAHZ! I need help choosing a size.")} target="_blank" rel="noreferrer">
              <WhatsAppIcon size={20} /> Chat on WhatsApp
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
