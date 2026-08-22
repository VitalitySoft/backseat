"use client";

import { useState } from "react";
import { Flag, ShieldOff } from "lucide-react";

const REASONS = ["Unsafe driving", "Inappropriate behaviour", "No-show", "Fake profile", "Other"];

export function ReportBlockActions({ userId, loggedIn }: { userId: string; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  if (!loggedIn) return null;

  async function submitReport() {
    if (!reason) return;
    setStatus("sending");
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportedId: userId, reason, details }),
    });
    setStatus("sent");
  }

  async function blockUser() {
    if (!confirm("Block this user? You won't be matched with them again.")) return;
    await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedId: userId }),
    });
    alert("User blocked.");
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3 text-sm">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-text-soft hover:text-rose-deep">
        <Flag className="h-3.5 w-3.5" /> Report this user
      </button>
      <button onClick={blockUser} className="flex items-center gap-1.5 text-text-soft hover:text-rose-deep">
        <ShieldOff className="h-3.5 w-3.5" /> Block
      </button>

      {open && (
        <div className="mt-2 w-full rounded-2xl border border-paper-line bg-white p-4">
          {status === "sent" ? (
            <p className="text-sm text-banyan-deep">Thanks — our safety team will review this.</p>
          ) : (
            <>
              <p className="mb-2 text-sm font-medium text-text">Why are you reporting this user?</p>
              <div className="flex flex-wrap gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      reason === r ? "border-rose-deep bg-rose-pale text-rose-deep" : "border-paper-line text-text-soft"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Additional details (optional)"
                rows={2}
                className="mt-3 w-full rounded-xl border border-paper-line px-3 py-2 text-sm outline-none focus:border-marigold"
              />
              <button
                onClick={submitReport}
                disabled={!reason || status === "sending"}
                className="mt-3 rounded-full bg-rose-deep px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {status === "sending" ? "Sending…" : "Submit report"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
