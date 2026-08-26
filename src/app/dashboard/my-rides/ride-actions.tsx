"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Flag, QrCode, ChevronUp } from "lucide-react";
import { QrDisplay } from "@/app/dashboard/qr/qr-display";

export function JoinRequestActions({ rideId, joinId }: { rideId: string; joinId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: "ACCEPTED" | "DECLINED" | "COMPLETED") {
    setLoading(status);
    setError(null);
    const res = await fetch(`/api/rides/${rideId}/joins/${joinId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
    }
    setLoading(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={() => updateStatus("ACCEPTED")}
          disabled={loading !== null}
          className="flex items-center gap-1 rounded-full bg-banyan-pale px-3 py-1.5 text-xs font-semibold text-banyan-deep hover:bg-banyan hover:text-white disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" /> Accept
        </button>
        <button
          onClick={() => updateStatus("DECLINED")}
          disabled={loading !== null}
          className="flex items-center gap-1 rounded-full bg-rose-pale px-3 py-1.5 text-xs font-semibold text-rose-deep hover:bg-rose-deep hover:text-white disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" /> Decline
        </button>
      </div>
      {error && <p className="mt-1.5 text-[11px] text-rose-deep">{error}</p>}
    </div>
  );
}

/**
 * Handles the ACCEPTED -> COMPLETED transition, and either way lets the rider
 * pull up their charity QR right on this page — no need to jump to a separate
 * screen while the passenger is still standing there.
 */
export function JoinCompletionPanel({
  rideId,
  joinId,
  status,
  charityCode,
  riderName,
  isVehicleVerified,
}: {
  rideId: string;
  joinId: string;
  status: "ACCEPTED" | "COMPLETED";
  charityCode: string;
  riderName: string;
  isVehicleVerified: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(status === "COMPLETED");
  const [showQr, setShowQr] = useState(false);

  async function complete() {
    setLoading(true);
    await fetch(`/api/rides/${rideId}/joins/${joinId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    setLoading(false);
    setIsCompleted(true);
    setShowQr(true);
    router.refresh();
  }

  return (
    <div>
      {!isCompleted ? (
        <button
          onClick={complete}
          disabled={loading}
          className="flex items-center gap-1 rounded-full bg-paper-dim px-3 py-1.5 text-xs font-semibold text-ink hover:bg-marigold-pale disabled:opacity-50"
        >
          <Flag className="h-3.5 w-3.5" /> {loading ? "Marking…" : "Mark travelled"}
        </button>
      ) : isVehicleVerified ? (
        <button
          onClick={() => setShowQr((v) => !v)}
          className="flex items-center gap-1 rounded-full bg-marigold-pale px-3 py-1.5 text-xs font-semibold text-marigold-deep hover:bg-marigold hover:text-ink"
        >
          {showQr ? <ChevronUp className="h-3.5 w-3.5" /> : <QrCode className="h-3.5 w-3.5" />}
          {showQr ? "Hide QR" : "Show Charity QR"}
        </button>
      ) : null}

      {showQr && (
        <div className="mt-4">
          <QrDisplay charityCode={charityCode} riderName={riderName} />
        </div>
      )}
    </div>
  );
}

export function RideOfferStatusButton({
  rideId,
  status,
}: {
  rideId: string;
  status: "COMPLETED" | "CANCELLED";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update() {
    setLoading(true);
    await fetch(`/api/rides/${rideId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={update}
      disabled={loading}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
        status === "CANCELLED"
          ? "bg-rose-pale text-rose-deep hover:bg-rose-deep hover:text-white"
          : "bg-paper-dim text-ink hover:bg-marigold-pale"
      }`}
    >
      {status === "CANCELLED" ? "Cancel ride" : "Mark completed"}
    </button>
  );
}
