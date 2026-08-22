"use client";

import { useState } from "react";
import { AlertTriangle, PhoneCall } from "lucide-react";

export function SosButton({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  async function trigger() {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    await fetch("/api/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: window.location.pathname }),
    });
    setSent(true);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full bg-rose-deep px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-deep/30 hover:bg-rose-700"
      >
        <AlertTriangle className="h-4 w-4" /> SOS
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 px-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center">
            {sent ? (
              <>
                <AlertTriangle className="mx-auto h-8 w-8 text-rose-deep" />
                <p className="mt-3 font-display text-lg text-ink">Alert sent to our safety team</p>
                <p className="mt-2 text-sm text-text-soft">
                  If you are in immediate danger, please call local emergency services right now.
                </p>
                <a
                  href="tel:112"
                  className="mt-4 flex items-center justify-center gap-2 rounded-full bg-rose-deep px-5 py-3 text-sm font-semibold text-white"
                >
                  <PhoneCall className="h-4 w-4" /> Call 112 (India Emergency)
                </a>
                <button onClick={() => setOpen(false)} className="mt-3 text-sm text-text-soft hover:underline">
                  Close
                </button>
              </>
            ) : (
              <>
                <AlertTriangle className="mx-auto h-8 w-8 text-rose-deep" />
                <p className="mt-3 font-display text-lg text-ink">Trigger an SOS alert?</p>
                <p className="mt-2 text-sm text-text-soft">
                  This notifies our safety team immediately. For life-threatening emergencies,
                  call 112 directly — don&apos;t wait for a response here.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full border border-paper-line px-4 py-2.5 text-sm font-semibold text-text"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={trigger}
                    className="flex-1 rounded-full bg-rose-deep px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Send alert
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
