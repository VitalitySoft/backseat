"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, ChevronUp } from "lucide-react";

interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  senderName: string;
}

export function ChatPanel({
  rideId,
  joinId,
  currentUserId,
  otherPartyName,
}: {
  rideId: string;
  joinId: string;
  currentUserId: string;
  otherPartyName: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/rides/${rideId}/joins/${joinId}/messages`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages);
  }

  useEffect(() => {
    if (!open) return;
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setDraft("");
    await fetch(`/api/rides/${rideId}/joins/${joinId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    await load();
    setSending(false);
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full bg-paper-dim px-3 py-1.5 text-xs font-semibold text-ink hover:bg-marigold-pale"
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
        {open ? "Hide chat" : `Chat with ${otherPartyName.split(" ")[0]}`}
      </button>

      {open && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-paper-line bg-white">
          <div ref={scrollRef} className="max-h-64 space-y-2 overflow-y-auto p-3">
            {messages.length === 0 && (
              <p className="py-6 text-center text-xs text-text-soft">
                No messages yet. Say hello and share pickup details.
              </p>
            )}
            {messages.map((m) => {
              const mine = m.senderId === currentUserId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      mine ? "bg-ink text-on-ink" : "bg-paper-dim text-text"
                    }`}
                  >
                    <p>{m.body}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-on-ink-soft" : "text-text-soft"}`}>
                      {new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 border-t border-paper-line p-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Where should we meet?"
              maxLength={500}
              className="w-full rounded-full border border-paper-line bg-paper px-3 py-2 text-sm outline-none focus:border-marigold"
            />
            <button
              onClick={send}
              disabled={sending || !draft.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marigold text-ink disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
