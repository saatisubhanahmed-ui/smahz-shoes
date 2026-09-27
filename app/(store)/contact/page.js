import Link from "next/link";
import ContactForm from "@/components/store/ContactForm";
import { site, whatsappLink } from "@/lib/site";
import { ClockIcon, FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, TikTokIcon, WhatsAppIcon } from "@/components/Icons";

export const metadata = {
  title: "Contact Us",
  description: "Questions about sizing, an order or a product? Contact SMAHZ on WhatsApp, email or the contact form.",
};

export default function ContactPage() {
  const channels = [
    { label: "WhatsApp", value: site.phoneDisplay, href: whatsappLink("Hi SMAHZ!"), icon: WhatsAppIcon, color: "#25d366" },
    { label: "Call us", value: `+${site.whatsapp}`, href: `tel:+${site.whatsapp}`, icon: PhoneIcon, color: "#e11d2a" },
    { label: "Email", value: site.email, href: `mailto:${site.email}`, icon: MailIcon, color: "#f87171" },
    { label: "Instagram", value: site.handles.instagram, href: site.socials.instagram, icon: InstagramIcon, color: "#e879f9" },
    { label: "TikTok", value: site.handles.tiktok, href: site.socials.tiktok, icon: TikTokIcon, color: "#f5f5f4" },
    { label: "Facebook", value: site.handles.facebook, href: site.socials.facebook, icon: FacebookIcon, color: "#60a5fa" },
  ];

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Home</Link> / <span>Contact</span>
          </div>
          <span className="eyebrow">Get in touch</span>
          <h1 className="h1">Contact Us</h1>
          <p className="lead">
            Questions about sizing, an order, or a product? Reach out on WhatsApp for the fastest reply, or send us a message
            below — it lands straight in our inbox.
          </p>
          <div className="rule" />
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">
          <div>
            <div className="channel-list">
              {channels.map(({ label, value, href, icon: Icon, color }) => (
                <a key={label} className="channel" href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  <span className="ic" style={{ background: `${color}1f`, color }}>
                    <Icon size={20} />
                  </span>
                  <div>
                    <small>{label}</small>
                    <b>{value}</b>
                  </div>
                </a>
              ))}
            </div>
            <div className="card-panel mt-16" style={{ padding: 22 }}>
              <div className="flex gap-12 items-center">
                <ClockIcon size={20} style={{ color: "var(--accent)" }} />
                <div>
                  <b>Support hours</b>
                  <p className="small muted">Mon – Sat · 10:00 AM – 9:00 PM (PKT)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-panel">
            <span className="eyebrow">Send a message</span>
            <h2 className="h2" style={{ fontSize: 30, margin: "10px 0 6px" }}>We&apos;d love to hear from you</h2>
            <p className="muted" style={{ marginBottom: 26 }}>Fill in the form and we&apos;ll reply by email within 24 hours.</p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
