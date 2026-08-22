"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SharingToggle({
  initialActive,
  isVerified,
}: {
  initialActive: boolean;
  isVerified: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (!isVerified) {
      setError("Your vehicle needs to be verified before you can start sharing rides.");
      return;
    }
    setLoading(true);
    setError(null);
    const next = !active;
    const res = await fetch("/api/rider/sharing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next }),
    });
    if (res.ok) {
      setActive(next);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't update sharing status");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-paper-line bg-white px-5 py-4">
      <button
        role="switch"
        aria-checked={active}
        onClick={toggle}
        disabled={loading}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          active ? "bg-banyan" : "bg-paper-line"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            active ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-semibold text-ink">
          Ride sharing is {active ? "ON" : "OFF"}
        </p>
        <p className="text-xs text-text-soft">
          {active
            ? "Passengers can find and join your active rides."
            : "Turn this on so passengers can find your rides."}
        </p>
        {error && <p className="mt-1 text-xs text-rose-deep">{error}</p>}
      </div>
    </div>
  );
}
