// Central store configuration — edit here to change brand details everywhere.

const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923022059877";

export const site = {
  name: "SMAHZ",
  fullName: "SMAHZ Shoes",
  tagline: "Walk Bold.",
  description:
    "SMAHZ is a Pakistan-based shoe brand — premium sneakers, runners and formal shoes with Cash on Delivery nationwide.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",

  phoneDisplay: "0302 2059877",
  whatsapp, // international format, digits only
  email: process.env.NEXT_PUBLIC_STORE_EMAIL || "your-store-email@gmail.com",
  city: "Pakistan",

  // Update these with your real social pages
  socials: {
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/",
    facebook: "https://facebook.com/",
  },
  handles: {
    instagram: "@smahz.shoes",
    tiktok: "@smahz.shoes",
    facebook: "SMAHZ Shoes",
  },

  currency: "Rs",
  shipping: {
    flat: 200, // delivery fee in PKR
    freeAbove: 5000, // orders at or above this subtotal ship free
  },

  announcements: [
    "Cash on Delivery all over Pakistan",
    "Delivery in 2–5 business days",
    "Easy 7-day exchange policy",
    "Free delivery on orders above Rs 5,000",
  ],

  paymentMethods: [
    { id: "cod", label: "Cash on Delivery", note: "Pay in cash when your parcel arrives." },
    { id: "bank_transfer", label: "Bank Transfer", note: "We'll WhatsApp you our account details after confirming." },
    { id: "easypaisa", label: "Easypaisa / JazzCash", note: "We'll share the wallet number on WhatsApp." },
  ],
};

export function whatsappLink(text = "") {
  const base = `https://wa.me/${site.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function calcShipping(subtotal) {
  if (subtotal <= 0) return 0;
  return subtotal >= site.shipping.freeAbove ? 0 : site.shipping.flat;
}
