import Link from "next/link";
import { site, whatsappLink } from "@/lib/site";
import { FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon, TikTokIcon, WhatsAppIcon } from "../Icons";

export default function Footer() {
  return (
    <footer className="footer dark">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-transparent-sm.png" alt="SMAHZ Shoes" width="136" height="84" />
            </Link>
            <p className="muted mt-16" style={{ maxWidth: 320 }}>
              Premium shoes built for people who walk bold. Cash on Delivery across Pakistan, easy exchanges and real
              support on WhatsApp.
            </p>
            <div className="socials">
              <a className="icon-btn" href={site.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                <InstagramIcon size={18} />
              </a>
              <a className="icon-btn" href={site.socials.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
                <TikTokIcon size={16} />
              </a>
              <a className="icon-btn" href={site.socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                <FacebookIcon size={16} />
              </a>
              <a className="icon-btn" href={whatsappLink()} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <WhatsAppIcon size={17} />
              </a>
            </div>
          </div>

          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/shop">Shop All</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/track-order">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h4>Help</h4>
            <ul>
              <li><Link href="/about#policies">Exchange Policy</Link></li>
              <li><Link href="/about#policies">Delivery Info</Link></li>
              <li><Link href="/about#policies">Size Guide</Link></li>
              <li><Link href="/contact">FAQs &amp; Support</Link></li>
            </ul>
          </div>

          <div>
            <h4>Get in touch</h4>
            <ul>
              <li>
                <a href={whatsappLink()} target="_blank" rel="noreferrer">
                  <WhatsAppIcon size={16} /> {site.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`tel:+${site.whatsapp}`}>
                  <PhoneIcon size={16} /> +{site.whatsapp}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`}>
                  <MailIcon size={16} /> {site.email}
                </a>
              </li>
              <li>
                <span>
                  <PinIcon size={16} /> Delivering all over {site.city}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} SMAHZ Shoes. All rights reserved.</span>
          <span>Walk Bold · Delivering across Pakistan</span>
        </div>
      </div>
    </footer>
  );
}
