"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Flag } from "lucide-react";

export function JoinRequestActions({ rideId, joinId }: { rideId: string; joinId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(status: "ACCEPTED" | "DECLINED" | "COMPLETED") {
    setLoading(status);
    await fetch(`/api/rides/${rideId}/joins/${joinId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => updateStatus("ACCEPTED")}
        disabled={loading !== null}
        className="flex items-center gap-1 rounded-full bg-banyan-pale px-3 py-1.5 text-xs font-semibold text-banyan-deep hover:bg-banyan hover:text-white"
      >
        <Check className="h-3.5 w-3.5" /> Accept
      </button>
      <button
        onClick={() => updateStatus("DECLINED")}
        disabled={loading !== null}
        className="flex items-center gap-1 rounded-full bg-rose-pale px-3 py-1.5 text-xs font-semibold text-rose-deep hover:bg-rose-deep hover:text-white"
      >
        <X className="h-3.5 w-3.5" /> Decline
      </button>
    </div>
  );
}

export function CompleteJoinButton({ rideId, joinId }: { rideId: string; joinId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function complete() {
    setLoading(true);
    await fetch(`/api/rides/${rideId}/joins/${joinId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={complete}
      disabled={loading}
      className="flex items-center gap-1 rounded-full bg-paper-dim px-3 py-1.5 text-xs font-semibold text-ink hover:bg-marigold-pale"
    >
      <Flag className="h-3.5 w-3.5" /> Mark travelled
    </button>
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
