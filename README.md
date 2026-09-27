# SMAHZ Shoes — Full-Stack E-commerce Website

**Frontend:** Next.js 15 (App Router) + React 19 · **Backend:** Next.js API routes + Supabase (Postgres + Storage) · **Email:** Resend + Gmail (Nodemailer) · **AI:** Claude / Gemini chatbot

White / black / red shoe store (gold SMAHZ logo) with 4 ways to order — including an **AI Assistant that takes the order in chat** — order tracking, contact form emails and a full admin panel.

---

## ✨ Features

**Store (customer side)**
- **Home** — announcement marquee, full-screen hero with 3 background videos playing one after another, shop-by-category, Latest Arrivals, sale banner, Best Sellers, "3 ways to order", features, WhatsApp CTA
- **Shop** — category filters, search, sort by price
- **Product page** — image gallery, size & color picker, quantity, Add to cart / Buy now, "Ask on WhatsApp"
- **About** — brand story, promise, delivery / exchange policy, size guide
- **Contact** — WhatsApp, call, email, socials + **contact form → email to you** (Resend / Gmail) + saved in admin
- **Track Order** — enter order number (e.g. `SMZ-7K3PMX9A`) → live status timeline
- **Cart drawer with 3 options:**
  1. **Send order on WhatsApp** → order saved + WhatsApp opens with full order typed to **0302 2059877**
  2. **Send order on Email** → order saved + emailed to you (and a copy to the customer)
  3. **Checkout & Place order** → full checkout page (COD / Bank transfer / Easypaisa-JazzCash)
  4. **Order with AI Assistant** → the AI shows the cart, asks you to confirm, collects name, phone, city, address, email and payment one by one, then gives the **tracking number**
- **Checkout page has 2 options:** fill the form yourself, or let the AI Assistant do it
- **AI chat button** (above the WhatsApp button) on every page — size help, delivery questions, product suggestions, order tracking, and ordering
- Floating WhatsApp button, quick-add popup, free-delivery progress bar, cart saved in browser, mobile-friendly design

**Admin panel (`/admin`)**
- Secure login (username + password from `.env.local`)
- Dashboard: revenue, orders, pending count, 14-day sales chart, orders by channel/status
- Orders: search, filter by status/channel, pagination, order detail, change status, note for customer (shows on Track Order), private note, email customer on status change, WhatsApp/call customer, print slip, delete
- Products: add / edit / delete, image upload (Supabase Storage) or image URL, sizes, colors, stock, sale price, show/hide, featured
- Categories: add / edit / delete
- Messages: contact-form inbox, mark read, reply by email / WhatsApp

**Security:** prices are re-checked on the server (customers can't change prices), service-role key used only on the server, RLS enabled, rate-limiting on forms, honeypot anti-spam, admin routes protected by middleware.

---

## 🚀 Setup (Step by step)

### 1) Install & run
```bash
npm install
npm run dev
```
Open **http://localhost:3000** — website will already work with **demo products** even before Supabase is connected.

### 2) Supabase (database)
1. https://supabase.com → **New project** banao
2. Left menu → **SQL Editor** → **New query** → `supabase/schema.sql` ka **poora code paste** karo → **Run**
   (tables, security rules, image bucket aur 8 sample products ban jayenge)
3. **Project Settings → API** se ye 3 cheezein copy karo aur `.env.local` mein paste karo:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3) Email — Resend
1. https://resend.com → sign up → **API Keys → Create** → key `RESEND_API_KEY` mein paste karo
2. `ADMIN_EMAIL` mein wohi email likho jis se Resend account banaya
   > Free Resend (bina domain verify kiye) sirf **apne account wali email** par bhejta hai. Customers ko bhi email bhejni ho to Resend mein apna domain verify karo aur `RESEND_FROM` badlo, e.g. `SMAHZ <orders@yourdomain.com>`.

### 4) Email — Gmail (backup / alternative)
1. Google Account → **Security** → **2-Step Verification ON**
2. Search "**App passwords**" → app banao → 16-letter password milega
3. `.env.local`: `GMAIL_USER=yourgmail@gmail.com` aur `GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx`

`EMAIL_PROVIDER=resend` ho to pehle Resend try hoga, fail hua to Gmail se chali jayegi (ya `gmail` likh do to ulta).

### 5) AI Assistant (chatbot)
`.env.local` mein **ek** key daal dein:
- **Gemini (free tier):** https://aistudio.google.com/apikey → `GEMINI_API_KEY`
- **Claude:** https://console.anthropic.com → `ANTHROPIC_API_KEY`

Koi key na ho to bhi assistant chalega (built-in smart mode): order confirm karega, saari details lega aur tracking number dega. Agar AI service fail ho jaye to bhi yahi smart mode khud chal jata hai.

> Pehle wala `schema.sql` already run kar chuke hain? To `supabase/update-v2.sql` bhi ek dafa run kar dein (AI orders ke liye).

### 6) Admin panel
`.env.local` mein `ADMIN_USERNAME` / `ADMIN_PASSWORD` set karo, phir **http://localhost:3000/admin** kholo.

> `.env.local` badalne ke baad hamesha `npm run dev` **restart** karo.

---

## 🧾 Customize
| What | Where |
|---|---|
| Phone, WhatsApp, email, delivery fee, free-delivery limit, marquee text, payment methods, social links | `lib/site.js` |
| Colors / fonts / design | `app/globals.css` (`:root` = light theme, `.dark` = hero/footer/admin) |
| AI assistant behaviour & store facts it knows | `lib/assistant.js` |
| Home page background videos (play 1 → 2 → 3 → repeat) | `public/videos/hero-1/2/3.mp4` (+ `.webm`, `.jpg` poster) · order in `components/store/HeroVideo.js` |
| Logo | `public/logo.png` (on black), `public/logo-transparent-sm.png` (header), `public/logo-mark.png`, `public/favicon.png` |
| Products & categories | Admin panel → Products / Categories |

---

## 📁 Project structure
```
app/
  (store)/            → Home, Shop, Product, About, Contact, Track Order, Checkout
  admin/              → Admin login + panel (dashboard, orders, products, categories, messages)
  api/                → orders, track, contact, assistant (AI), admin/* (REST endpoints)
components/store/     → Header, Footer, Cart drawer, Order modal, Product card …
components/admin/     → Admin shell, product form, orders table
lib/                  → Supabase client, data access, orders, AI assistant, email (Resend + Gmail), templates, validation
supabase/schema.sql   → Database tables + security + sample data
middleware.js         → Protects /admin
```

## ☁️ Deploy (optional)
Push to GitHub → import on **vercel.com** → add all `.env.local` variables in Vercel → Deploy. Change `NEXT_PUBLIC_SITE_URL` to your live URL.
