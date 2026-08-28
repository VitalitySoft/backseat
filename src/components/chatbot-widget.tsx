"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Phone, Send, X } from "lucide-react";
import { CUSTOMER_CARE_PHONE, CUSTOMER_CARE_WHATSAPP, CUSTOMER_CARE_WHATSAPP_MESSAGE } from "@/lib/constants";

type Message = {
  role: "user" | "assistant";
  content: string;
  links?: { label: string; href: string }[];
  showSupportActions?: boolean;
};

const STARTER_MESSAGES: Message[] = [
  {
    role: "assistant",
    content: "Hi, I can answer questions about Backseat rides, donations, rider QR codes, safety, and account setup.",
  },
];

const SUGGESTIONS = [
  "How do I offer a ride?",
  "How do donations work?",
  "How can I find a ride?",
];

const FALLBACK_SUPPORT_TEXT = [
  "I do not have a clear answer for that yet",
  "I could not answer that yet",
];

function shouldShowSupportActions(answer: unknown, found: unknown) {
  if (found === false) return true;
  if (typeof answer !== "string") return true;
  return FALLBACK_SUPPORT_TEXT.some((text) => answer.includes(text));
}

const whatsappUrl = `https://wa.me/${CUSTOMER_CARE_WHATSAPP}?text=${encodeURIComponent(CUSTOMER_CARE_WHATSAPP_MESSAGE)}`;

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(STARTER_MESSAGES);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function sendMessage(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await response.json();
      const answer = data.answer ?? "I could not answer that yet.";

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: answer,
          links: data.links ?? [],
          showSupportActions: shouldShowSupportActions(answer, data.found),
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I could not connect right now. Please try again in a moment.",
          showSupportActions: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
      {open && (
        <section className="mb-3 flex h-[520px] max-h-[calc(100vh-7rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-paper-line bg-white shadow-2xl shadow-ink/15">
          <div className="flex items-center justify-between bg-ink px-4 py-3 text-on-ink">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marigold text-ink">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold">Backseat Assistant</h2>
                <p className="text-xs text-on-ink-soft">Answers on the fly</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-on-ink-soft hover:bg-white/10 hover:text-on-ink"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-paper px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-ink text-on-ink"
                      : "border border-paper-line bg-white text-text"
                  }`}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                  {!!message.links?.length && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="rounded-full bg-marigold-pale px-3 py-1 text-xs font-semibold text-ink hover:bg-marigold"
                          onClick={() => setOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                  {message.showSupportActions && (
                    <div className="mt-3 space-y-2 border-t border-paper-line pt-3">
                      <p className="text-xs font-semibold text-text-soft">Contact customer care</p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`tel:${CUSTOMER_CARE_PHONE}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-on-ink hover:opacity-90"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Call
                        </a>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-banyan px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-paper-line bg-white px-4 py-3 text-sm text-text-soft">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-paper-line bg-white p-3">
            <div className="mb-2 flex gap-2 overflow-x-auto scrollbar-none">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void sendMessage(suggestion)}
                  className="shrink-0 rounded-full border border-paper-line px-3 py-1.5 text-xs font-semibold text-text-soft hover:border-marigold hover:text-ink"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about Backseat"
                className="min-w-0 flex-1 rounded-full border border-paper-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-marigold"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-on-ink disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-on-ink shadow-xl shadow-ink/20 transition-transform hover:scale-105"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
