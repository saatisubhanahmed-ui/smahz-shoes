// SMAHZ AI Assistant — server side.
//
// Provider order:  Claude (ANTHROPIC_API_KEY)  →  Gemini (GEMINI_API_KEY)  →  built-in smart assistant.
// The LLM talks to the customer and calls tools; the SERVER does the real work
// (pricing the cart from the database, validating details, saving the order).
import { getProducts } from "./data";
import { formatPrice } from "./format";
import { OrderError, createOrder, priceCart, publicOrder } from "./orders";
import { findOrderByNumber } from "./repo";
import { site } from "./site";
import { EMAIL_RE, normalizePhone } from "./validation";

const PAYMENT_LABELS = Object.fromEntries(site.paymentMethods.map((p) => [p.id, p.label]));
const ORDER_RE = /SMZ-[A-Z0-9]{6,10}/i;

function real(v) {
  return Boolean(v) && !/x{6,}|^your-/i.test(String(v).replace(/\s/g, ""));
}

export function aiProvider() {
  const pref = (process.env.AI_PROVIDER || "auto").toLowerCase();
  const hasClaude = real(process.env.ANTHROPIC_API_KEY);
  const hasGemini = real(process.env.GEMINI_API_KEY);
  if (pref === "claude" && hasClaude) return "claude";
  if (pref === "gemini" && hasGemini) return "gemini";
  if (pref === "smart") return "smart";
  if (hasClaude) return "claude";
  if (hasGemini) return "gemini";
  return "smart";
}

/* ====================================================================
   Shared helpers
   ==================================================================== */

async function cartSummary(cartLines) {
  if (!cartLines?.length) return { empty: true };
  try {
    const cart = await priceCart(cartLines);
    const text = cart.items
      .map((i) => `• ${i.name} — Size ${i.size || "-"}${i.color ? `, ${i.color}` : ""} × ${i.quantity} = ${formatPrice(i.price * i.quantity)}`)
      .join("\n");
    return { ...cart, text };
  } catch (err) {
    return { error: err.message };
  }
}

function totalsText(c) {
  return `Subtotal ${formatPrice(c.subtotal)} · Delivery ${c.shipping ? formatPrice(c.shipping) : "FREE"} · **Total ${formatPrice(c.total)}**`;
}

async function trackOrderTool(orderNumber) {
  const o = await findOrderByNumber(String(orderNumber || ""));
  if (!o) return { found: false, message: "No order found with that number." };
  return {
    found: true,
    order_number: o.order_number,
    status: o.status,
    placed_on: o.created_at,
    city: o.city,
    total: o.total,
    items: o.items.map((i) => `${i.name} (size ${i.size || "-"}) × ${i.quantity}`),
    note_from_store: o.tracking_note || null,
  };
}

async function placeOrderTool(input, cartLines) {
  try {
    const { order } = await createOrder({
      channel: "ai",
      customer: {
        customer_name: input.customer_name,
        phone: input.phone,
        email: input.email || "",
        city: input.city,
        address: input.address,
        notes: input.notes || "",
      },
      payment_method: input.payment_method,
      items: cartLines,
    });
    return { result: { ok: true, order_number: order.order_number, total: order.total }, order };
  } catch (err) {
    const msg = err instanceof OrderError ? err.message : "Could not save the order right now.";
    return { result: { ok: false, error: msg } };
  }
}

/* ====================================================================
   LLM system prompt + tools
   ==================================================================== */

async function systemPrompt(cartLines) {
  const [products, cart] = await Promise.all([getProducts({ limit: 40 }), cartSummary(cartLines)]);
  const catalog = products
    .map(
      (p) =>
        `- ${p.name} | ${formatPrice(p.price)}${p.compare_at_price ? ` (was ${formatPrice(p.compare_at_price)})` : ""} | ${p.category?.name || "Shoes"} | sizes ${p.sizes?.join(",") || "-"} | ${p.stock > 0 ? "in stock" : "out of stock"} | link: /product/${p.slug}`
    )
    .join("\n");

  const cartText = cart.empty
    ? "The customer's cart is EMPTY."
    : cart.error
    ? `Cart problem: ${cart.error}`
    : `${cart.text}\n${totalsText(cart)}`;

  return `You are "SMAHZ AI", the friendly shopping assistant of SMAHZ Shoes — an online shoe store in Pakistan.

STORE FACTS
- Delivery all over Pakistan in 2–5 business days. Delivery fee ${formatPrice(site.shipping.flat)}, FREE on orders of ${formatPrice(site.shipping.freeAbove)} or more.
- Payment: Cash on Delivery, Bank Transfer, or Easypaisa/JazzCash (details shared on WhatsApp after confirming).
- Easy 7-day size exchange (unworn, original box).
- WhatsApp / phone: ${site.phoneDisplay}. Email: ${site.email}.
- Sizes are EU: 39 (UK 6, 24.5cm), 40 (UK 6.5, 25cm), 41 (UK 7.5, 25.8cm), 42 (UK 8, 26.5cm), 43 (UK 9, 27.3cm), 44 (UK 10, 28cm), 45 (UK 11, 28.8cm).
- Customers can track orders on the Track Order page (/track-order) with their order number (format SMZ-XXXXXXXX).

PRODUCT CATALOG
${catalog || "(no products yet)"}

CUSTOMER'S CART RIGHT NOW (prices verified by the server)
${cartText}

HOW TO TAKE AN ORDER — follow these steps exactly:
1. Show the cart items with sizes, quantities and the total, and ask the customer to CONFIRM the items are correct.
2. After they confirm, collect these details ONE AT A TIME (one question per message):
   a) full name  b) mobile number (Pakistani, like 03XX XXXXXXX)  c) city  d) complete delivery address (house, street, area)
   e) email — optional, they can say "skip"  f) payment method: Cash on Delivery, Bank Transfer, or Easypaisa/JazzCash.
3. Show a short review of ALL details + total and ask for final confirmation.
4. ONLY after a clear "yes", call the place_order tool. Never invent or guess any detail.
5. If place_order returns an error, explain it simply and ask for the corrected detail.
6. When it succeeds, give the ORDER NUMBER in bold, say it can be tracked on the Track Order page, and that the team will confirm on WhatsApp.
- If the cart is empty and they want to order, ask them to add shoes to the cart first (suggest products with links like [SMAHZ Aero Runner](/product/smahz-aero-runner)).
- If they give an order number or ask about an order, use the track_order tool.

STYLE
- Reply in the customer's language (English, Urdu or Roman Urdu). Be warm, short (under 90 words) and clear.
- Use **bold** for important info and markdown links for products. No tables.
- Only talk about SMAHZ, shoes, orders and delivery.`;
}

const TOOLS = [
  {
    name: "place_order",
    description:
      "Place the order for the items currently in the customer's cart. Call ONLY after the customer has confirmed the items AND given all required details AND said yes to the final review.",
    params: {
      customer_name: { type: "string", description: "Customer's full name" },
      phone: { type: "string", description: "Pakistani mobile number, e.g. 03022059877" },
      email: { type: "string", description: "Email address, or empty string if skipped" },
      city: { type: "string", description: "City in Pakistan" },
      address: { type: "string", description: "Complete delivery address" },
      payment_method: { type: "string", enum: ["cod", "bank_transfer", "easypaisa"], description: "cod = Cash on Delivery" },
      notes: { type: "string", description: "Optional delivery notes" },
    },
    required: ["customer_name", "phone", "city", "address", "payment_method"],
  },
  {
    name: "track_order",
    description: "Look up the status of an existing order by its order number (format SMZ-XXXXXXXX).",
    params: { order_number: { type: "string", description: "The order number" } },
    required: ["order_number"],
  },
];

function cleanHistory(messages) {
  const list = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-24)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  while (list.length && list[0].role !== "user") list.shift();
  // merge consecutive messages from the same role
  const merged = [];
  for (const m of list) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += "\n" + m.content;
    else merged.push({ ...m });
  }
  return merged;
}

async function runTool(name, input, cartLines, state) {
  if (name === "place_order") {
    const { result, order } = await placeOrderTool(input || {}, cartLines);
    if (order) state.order = order;
    return result;
  }
  if (name === "track_order") return trackOrderTool(input?.order_number);
  return { error: "Unknown tool" };
}

/* ----------------------------- Claude ----------------------------- */

async function askClaude(history, cartLines) {
  const system = await systemPrompt(cartLines);
  const tools = TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: { type: "object", properties: t.params, required: t.required },
  }));
  const messages = history.map((m) => ({ role: m.role, content: m.content }));
  const state = {};

  for (let turn = 0; turn < 5; turn++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
        max_tokens: 800,
        system,
        tools,
        messages,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Claude API error ${res.status}`);

    const toolUses = (data.content || []).filter((b) => b.type === "tool_use");
    if (data.stop_reason !== "tool_use" || !toolUses.length) {
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      return { reply: text, order: state.order };
    }
    messages.push({ role: "assistant", content: data.content });
    const results = [];
    for (const t of toolUses) {
      const out = await runTool(t.name, t.input, cartLines, state);
      results.push({ type: "tool_result", tool_use_id: t.id, content: JSON.stringify(out) });
    }
    messages.push({ role: "user", content: results });
  }
  return { reply: state.order ? `Your order is placed! Order number: **${state.order.order_number}**` : "Sorry, please try again.", order: state.order };
}

/* ----------------------------- Gemini ----------------------------- */

async function askGemini(history, cartLines) {
  const system = await systemPrompt(cartLines);
  const upper = (p) =>
    Object.fromEntries(
      Object.entries(p).map(([k, v]) => [k, { type: "STRING", description: v.description, ...(v.enum ? { enum: v.enum } : {}) }])
    );
  const tools = [
    {
      functionDeclarations: TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: { type: "OBJECT", properties: upper(t.params), required: t.required },
      })),
    },
  ];
  const contents = history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const state = {};

  for (let turn = 0; turn < 5; turn++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        tools,
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Gemini API error ${res.status}`);

    const content = data.candidates?.[0]?.content;
    const parts = content?.parts || [];
    const calls = parts.filter((p) => p.functionCall);
    if (!calls.length) {
      const text = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join("\n").trim();
      return { reply: text || "Sorry, I didn't catch that — could you say it again?", order: state.order };
    }
    contents.push(content);
    const responses = [];
    for (const c of calls) {
      const out = await runTool(c.functionCall.name, c.functionCall.args, cartLines, state);
      responses.push({ functionResponse: { name: c.functionCall.name, response: { result: out } } });
    }
    contents.push({ role: "user", parts: responses });
  }
  return { reply: state.order ? `Your order is placed! Order number: **${state.order.order_number}**` : "Sorry, please try again.", order: state.order };
}

/** Suggest tap-able answers for the LLM's last question */
function llmQuickReplies(reply = "", ordered) {
  if (ordered) return ["Track my order", "Thanks!"];
  const r = reply.toLowerCase();
  if (/payment|cash on delivery|easypaisa/.test(r) && /\?/.test(r)) return site.paymentMethods.map((p) => p.label);
  if (/email/.test(r) && /skip|optional/.test(r)) return ["Skip"];
  if (/confirm|correct|place (the|your) order|sahi/.test(r) && /\?/.test(r)) return ["Yes, confirm", "No, change something"];
  return [];
}

/* ====================================================================
   Built-in "smart" assistant — works with NO API key.
   A guided, validated conversation that always completes the order.
   ==================================================================== */

const YES = /^(y|ye|yes|yeah|yep|ok|okay|sure|haan|han|ha|hn|ji|jee|g|confirm|confirmed|sahi|theek|thik|correct|done|place|go)\b/i;
const NO = /^(n|no|nope|nahi|nahin|nai|na|cancel|change|edit|wrong|galat)\b/i;

function detectPayment(t) {
  const s = t.toLowerCase();
  if (/easy|jazz|wallet/.test(s)) return "easypaisa";
  if (/bank|transfer|ibft/.test(s)) return "bank_transfer";
  if (/cash|cod|delivery/.test(s)) return "cod";
  return null;
}

async function faqReply(text, cartLines) {
  const t = text.toLowerCase();
  const menu = ["Place my order", "Delivery info", "Size help", "Track my order"];

  if (/deliver|shipping|charges|kitne din|kab/.test(t))
    return {
      reply: `We deliver **all over Pakistan in 2–5 business days** 🚚\nDelivery fee is **${formatPrice(site.shipping.flat)}** — and **FREE** on orders of ${formatPrice(site.shipping.freeAbove)} or more. Cash on Delivery is available everywhere.`,
      quickReplies: menu,
    };
  if (/size|fit|number|naap/.test(t))
    return {
      reply:
        "Our sizes are **EU**: 39 (UK 6) · 40 (UK 6.5) · 41 (UK 7.5) · 42 (UK 8) · 43 (UK 9) · 44 (UK 10) · 45 (UK 11).\nIf you're between sizes, go one up. Wrong size? **Free 7-day exchange** 👍 [See size guide](/about#size-guide)",
      quickReplies: menu,
    };
  if (/pay|cod|cash|easypaisa|jazz|bank/.test(t))
    return { reply: "You can pay by **Cash on Delivery**, **Bank Transfer** or **Easypaisa / JazzCash**. 💳", quickReplies: menu };
  if (/exchange|return|refund|wapas|badal/.test(t))
    return { reply: "Size not right? Message us within **7 days** of delivery for an easy exchange (unworn, original box).", quickReplies: menu };
  if (/track|status|kahan|where is/.test(t))
    return { reply: "Sure! Send me your **order number** (it looks like `SMZ-7K3PMX9A`) and I'll check it for you.", quickReplies: [] };
  if (/whatsapp|contact|call|phone|number/.test(t))
    return { reply: `You can reach us on WhatsApp at **${site.phoneDisplay}** or email **${site.email}**.`, quickReplies: menu };
  if (/recommend|suggest|best|product|shoe|joota|joote|sneaker|running|formal|casual|price|cheap|sasta/.test(t)) {
    const list = await getProducts({ limit: 4, featured: true });
    const lines = list.map((p) => `• [${p.name}](/product/${p.slug}) — **${formatPrice(p.price)}**`).join("\n");
    return { reply: `Here are some customer favourites 👟\n${lines}\nAdd one to your cart and I can place the order for you!`, quickReplies: menu };
  }
  if (/^(thanks|thank you|thx|shukriya|jazakallah)/.test(t))
    return { reply: "You're welcome! 😊 Walk bold with SMAHZ. Anything else I can help with?", quickReplies: menu };
  if (/^(hi|hello|hey|salam|assalam|aoa|slam)/.test(t) || !t.trim())
    return {
      reply: `Assalam o Alaikum! 👋 I'm **SMAHZ AI**. I can help you pick a size, answer delivery questions, track an order${cartLines?.length ? " or **place your order right here**" : ""}.`,
      quickReplies: menu,
    };
  return {
    reply: "I can help with orders, sizes, delivery, payments and tracking. What would you like to do?",
    quickReplies: menu,
  };
}

async function smartAssistant({ messages, cartLines, draft, start }) {
  const text = String([...messages].reverse().find((m) => m.role === "user")?.content || "").trim();
  const d = { step: "idle", customer: {}, ...(draft || {}) };
  d.customer = { ...(d.customer || {}) };
  const out = (reply, quickReplies = [], extra = {}) => ({ reply, quickReplies, draft: d, ...extra });

  // Global: cancel
  if (d.step !== "idle" && /^(cancel|stop|reset|band karo)\b/i.test(text)) {
    d.step = "idle";
    d.customer = {};
    return out("Okay, I've cancelled that. Your cart is still saved. 👍", ["Place my order", "Delivery info"]);
  }

  // Global: order number → track
  const num = text.match(ORDER_RE)?.[0];
  if (num && ["idle", "done"].includes(d.step)) {
    const t = await trackOrderTool(num);
    if (!t.found) return out(`I couldn't find **${num.toUpperCase()}**. Please double-check the number.`);
    return out(
      `Order **${t.order_number}** is currently **${t.status.toUpperCase()}** 📦\n${t.items.join("\n")}\nTotal: **${formatPrice(t.total)}**${t.note_from_store ? `\nUpdate: ${t.note_from_store}` : ""}\n[Open Track Order page](/track-order?order=${t.order_number})`,
      ["Delivery info", "Thanks!"]
    );
  }

  const wantsOrder =
    start === "order" ||
    (/\b(order|buy|checkout|place|kharid|khareed|lena|book)\b/i.test(text) && !/track|status|kahan|where/i.test(text));

  switch (d.step) {
    case "idle":
    case "done": {
      if (!wantsOrder) return faqReply(text, cartLines).then((r) => ({ ...r, draft: { ...d, step: "idle" } }));
      const cart = await cartSummary(cartLines);
      if (cart.empty) {
        return out("Your cart is empty right now 🛒 Add a pair from the [Shop](/shop), then tap **Order with AI Assistant** and I'll do the rest!", ["Recommend shoes", "Size help"]);
      }
      if (cart.error) return out(cart.error);
      d.step = "confirm";
      d.customer = {};
      return out(`Great choice! Here's your order 👇\n${cart.text}\n${totalsText(cart)}\n\n**Shall I confirm these items?**`, ["Yes, confirm", "No, change cart"]);
    }
    case "confirm":
      if (YES.test(text)) {
        d.step = "name";
        return out("Perfect! ✅ Let's get your delivery details.\nWhat's your **full name**?");
      }
      if (NO.test(text)) {
        d.step = "idle";
        return out("No problem — open the cart 🛒 to change items or sizes, then tap **Order with AI Assistant** again.");
      }
      return out("Please reply **Yes** to confirm the items, or **No** to change them.", ["Yes, confirm", "No, change cart"]);

    case "name":
      if (text.length < 2 || /\d{3,}/.test(text)) return out("Please type your **full name** (e.g. Muhammad Ali).");
      d.customer.customer_name = text.slice(0, 100);
      d.step = "phone";
      return out(`Thanks, **${d.customer.customer_name.split(" ")[0]}**! What's your **mobile / WhatsApp number**? (e.g. 03XX XXXXXXX)`);

    case "phone": {
      const p = normalizePhone(text);
      if (!/^(\+92|0092|92|0)?3\d{9}$/.test(p)) return out("That number doesn't look right 🤔 Please send a Pakistani mobile number like **03XX XXXXXXX**.");
      d.customer.phone = p;
      d.step = "city";
      return out("Got it 📱 Which **city** should we deliver to?", ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad"]);
    }
    case "city":
      if (text.length < 2) return out("Please type your **city** name.");
      d.customer.city = text.slice(0, 60);
      d.step = "address";
      return out(`Now your **complete address** in ${d.customer.city} (house #, street, area) 🏠`);

    case "address":
      if (text.length < 8) return out("Please share the **complete address** so the rider can find you (house #, street, area).");
      d.customer.address = text.slice(0, 300);
      d.step = "email";
      return out("What's your **email**? We'll send the order receipt there. (Type **Skip** if you don't want to.)", ["Skip"]);

    case "email":
      if (/^(skip|no|nahi|nai|none|-)\b/i.test(text)) d.customer.email = "";
      else if (EMAIL_RE.test(text)) d.customer.email = text.slice(0, 120);
      else return out("That email doesn't look valid. Please re-type it or tap **Skip**.", ["Skip"]);
      d.step = "payment";
      return out("How would you like to **pay**? 💳", site.paymentMethods.map((p) => p.label));

    case "payment": {
      const pm = detectPayment(text);
      if (!pm) return out("Please choose a payment method:", site.paymentMethods.map((p) => p.label));
      d.payment_method = pm;
      d.step = "review";
      const cart = await cartSummary(cartLines);
      if (cart.empty || cart.error) {
        d.step = "idle";
        return out(cart.error || "Your cart is empty now — please add items again.");
      }
      const c = d.customer;
      return out(
        `Please review your order 📝\n${cart.text}\n${totalsText(cart)}\n\n**Name:** ${c.customer_name}\n**Phone:** ${c.phone}\n**City:** ${c.city}\n**Address:** ${c.address}${c.email ? `\n**Email:** ${c.email}` : ""}\n**Payment:** ${PAYMENT_LABELS[pm]}\n\n**Shall I place this order?**`,
        ["Yes, place order", "Change details"]
      );
    }
    case "review": {
      if (NO.test(text)) {
        d.step = "name";
        d.customer = {};
        return out("Okay, let's fix it. What's your **full name**?");
      }
      if (!YES.test(text)) return out("Reply **Yes** to place the order, or **Change details** to edit.", ["Yes, place order", "Change details"]);
      const { result, order } = await placeOrderTool({ ...d.customer, payment_method: d.payment_method }, cartLines);
      if (!result.ok) {
        d.step = "name";
        d.customer = {};
        return out(`Sorry, ${result.error} Let's try again — what's your **full name**?`);
      }
      d.step = "done";
      d.customer = {};
      return out(
        `🎉 **Your order is placed!**\n\nYour tracking number is **${order.order_number}**\nTotal: **${formatPrice(order.total)}** (${PAYMENT_LABELS[order.payment_method]})\n\nWe'll confirm on WhatsApp shortly. You can track it anytime on the [Track Order page](/track-order?order=${order.order_number}).`,
        ["Track my order", "Thanks!"],
        { order }
      );
    }
    default:
      d.step = "idle";
      return faqReply(text, cartLines);
  }
}

/* ====================================================================
   Entry point used by /api/assistant
   ==================================================================== */

export async function runAssistant({ messages, cart, draft, start }) {
  const cartLines = Array.isArray(cart) ? cart.slice(0, 30) : [];
  const history = cleanHistory(messages);
  const provider = aiProvider();

  if (provider !== "smart" && history.length) {
    try {
      const fn = provider === "claude" ? askClaude : askGemini;
      const { reply, order } = await fn(history, cartLines);
      return {
        provider,
        reply: reply || "Sorry, could you say that again?",
        quickReplies: llmQuickReplies(reply, Boolean(order)),
        order: order ? publicOrder(order) : undefined,
      };
    } catch (err) {
      console.error(`[assistant] ${provider} failed, using smart assistant:`, err.message);
    }
  }

  const res = await smartAssistant({ messages: history, cartLines, draft, start });
  return { provider: "smart", ...res, order: res.order ? publicOrder(res.order) : undefined };
}
