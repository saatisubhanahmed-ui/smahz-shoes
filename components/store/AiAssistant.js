"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/format";
import { CheckIcon, CloseIcon, SendIcon, SparkleIcon } from "../Icons";

const GREETING = {
  role: "assistant",
  content:
    "Assalam o Alaikum! 👋 I'm **SMAHZ AI**, your shopping assistant.\nI can help you choose a size, answer delivery questions, track an order — or **place your order right here in the chat**.",
};
const START_CHIPS = ["Place my order", "Size help", "Delivery info", "Track my order"];

// Tiny, safe markdown: **bold**, `code`, [text](link), new lines
function renderMarkdown(text = "") {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/\[([^\]]+)\]\(((?:\/|https?:\/\/)[^)\s]*)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

export default function AiAssistant() {
  const cart = useCart();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [chips, setChips] = useState(START_CHIPS);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(null);
  const [placed, setPlaced] = useState(null);
  const [provider, setProvider] = useState("");
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const busy = useRef(false);

  // auto-scroll
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const send = useCallback(
    async (text, { start } = {}) => {
      const content = String(text || "").trim();
      if (!content || busy.current) return;
      busy.current = true;
      const next = [...messages, { role: "user", content }];
      setMessages(next);
      setInput("");
      setChips([]);
      setLoading(true);
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next,
            draft: start === "order" ? null : draft,
            start,
            cart: cart.items.map((i) => ({ product_id: i.product_id, size: i.size, color: i.color, quantity: i.quantity })),
          }),
        });
        const data = await res.json();
        setMessages((m) => [...m, { role: "assistant", content: data.reply || "Sorry, please try again." }]);
        setChips(data.quickReplies || []);
        setDraft(data.draft || null);
        if (data.provider) setProvider(data.provider);
        if (data.order) {
          setPlaced(data.order);
          cart.clearCart();
        }
      } catch {
        setMessages((m) => [...m, { role: "assistant", content: "I couldn't connect right now 😕 Please check your internet and try again." }]);
      } finally {
        busy.current = false;
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [messages, draft, cart]
  );

  // Opened from the cart drawer / checkout ("Order with AI Assistant")
  const req = cart.assistantRequest;
  useEffect(() => {
    if (!req) return;
    setOpen(true);
    if (req.start === "order") {
      setPlaced(null);
      send("I'd like to place my order 🛒", { start: "order" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req?.id]);

  // Esc closes; lock scroll on small screens
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const small = window.matchMedia("(max-width: 600px)").matches;
    if (small) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      if (small) document.body.style.overflow = "";
    };
  }, [open]);

  function reset() {
    setMessages([GREETING]);
    setChips(START_CHIPS);
    setDraft(null);
    setPlaced(null);
  }

  return (
    <>
      {!open && (
        <button className="ai-fab" onClick={() => setOpen(true)} aria-label="Chat with SMAHZ AI assistant">
          <span className="ai-fab-tip">Ask SMAHZ AI</span>
          <SparkleIcon size={26} />
        </button>
      )}

      {open && (
        <section className="ai-panel" role="dialog" aria-label="SMAHZ AI Assistant">
          <header className="ai-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" width="40" height="40" className="ai-avatar" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>SMAHZ AI Assistant</b>
              <small>
                <span className="ai-online" /> Online · {provider === "claude" ? "Powered by Claude" : provider === "gemini" ? "Powered by Gemini" : "Replies instantly"}
              </small>
            </div>
            <button className="ai-icon" onClick={reset} title="New chat" aria-label="Start a new chat">↺</button>
            <button className="ai-icon" onClick={() => setOpen(false)} aria-label="Close chat">
              <CloseIcon size={18} />
            </button>
          </header>

          <div
            className="ai-body"
            ref={bodyRef}
            onClick={(e) => {
              // open in-site links without reloading (keeps the chat)
              const a = e.target.closest("a");
              const href = a?.getAttribute("href");
              if (href && href.startsWith("/")) {
                e.preventDefault();
                router.push(href);
                if (window.matchMedia("(max-width: 600px)").matches) setOpen(false);
              }
            }}
          >
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role === "user" ? "me" : "bot"}`}>
                {m.role !== "user" && <span className="ai-dot"><SparkleIcon size={14} /></span>}
                <div className="ai-bubble" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
              </div>
            ))}

            {loading && (
              <div className="ai-msg bot">
                <span className="ai-dot"><SparkleIcon size={14} /></span>
                <div className="ai-bubble ai-typing"><i /><i /><i /></div>
              </div>
            )}

            {placed && !loading && (
              <div className="ai-order">
                <div className="ai-order-ic"><CheckIcon size={20} /></div>
                <div style={{ flex: 1 }}>
                  <small>Tracking number</small>
                  <b className="mono">{placed.order_number}</b>
                  <small>Total {formatPrice(placed.total)}</small>
                </div>
                <Link href={`/track-order?order=${placed.order_number}`} className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
                  Track
                </Link>
              </div>
            )}
          </div>

          {chips.length > 0 && !loading && (
            <div className="ai-chips">
              {chips.map((c) => (
                <button key={c} onClick={() => send(c, c === "Place my order" ? { start: "order" } : {})}>
                  {c}
                </button>
              ))}
            </div>
          )}

          <form
            className="ai-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              aria-label="Message"
              maxLength={800}
            />
            <button type="submit" disabled={!input.trim() || loading} aria-label="Send">
              <SendIcon size={18} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
