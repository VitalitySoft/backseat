"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function JoinButton({ rideId, loggedIn }: { rideId: string; loggedIn: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleJoin() {
    if (!loggedIn) {
      router.push(`/login?next=/rides/${rideId}`);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/rides/${rideId}/join`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't send your request");
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
    router.refresh();
  }

  if (sent) {
    return (
      <p className="rounded-2xl bg-banyan-pale px-5 py-4 text-sm text-banyan-deep">
        Request sent! The rider will confirm shortly — you&apos;ll be notified.
      </p>
    );
  }

  return (
    <div>
      <Button size="lg" className="w-full" onClick={handleJoin} disabled={loading}>
        {loading ? "Sending request…" : "Request to Join"}
      </Button>
      {error && <p className="mt-2 text-sm text-rose-deep">{error}</p>}
    </div>
  );
}
