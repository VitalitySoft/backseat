"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function defaultDeparture(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function OfferRideForm({ maxSeats }: { maxSeats: number }) {
  const router = useRouter();
  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [seatsAvailable, setSeatsAvailable] = useState(Math.min(1, maxSeats));
  const [departureAt, setDepartureAt] = useState(defaultDeparture);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/rides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startLocation,
        destination,
        seatsAvailable,
        departureAt: new Date(departureAt).toISOString(),
        notes,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }
    setSuccess(true);
    setStartLocation("");
    setDestination("");
    setNotes("");
    setDepartureAt(defaultDeparture());
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Starting from</label>
          <input
            required
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            placeholder="Koramangala, Bengaluru"
            className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Heading to</label>
          <input
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Whitefield, Bengaluru"
            className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Departure date &amp; time</label>
          <input
            required
            type="datetime-local"
            value={departureAt}
            min={defaultDeparture()}
            onChange={(e) => setDepartureAt(e.target.value)}
            className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
          />
          <p className="mt-1 text-xs text-text-soft">Passengers can&apos;t join once this time has passed.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Seats to share</label>
          <input
            required
            type="number"
            min={1}
            max={maxSeats}
            value={seatsAvailable}
            onChange={(e) => setSeatsAvailable(Number(e.target.value))}
            className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
          />
          <p className="mt-1 text-xs text-text-soft">Your vehicle has {maxSeats} spare seat(s) registered.</p>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text">Notes for passengers (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={240}
          placeholder="Meeting point details, luggage space, anything helpful."
          className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
        />
      </div>

      {error && <p className="rounded-xl bg-rose-pale px-4 py-2.5 text-sm text-rose-deep">{error}</p>}
      {success && (
        <p className="rounded-xl bg-banyan-pale px-4 py-2.5 text-sm text-banyan-deep">
          Your ride is live. Passengers heading your way can now find and join it.
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Publishing…" : "Publish this ride"}
      </Button>
    </form>
  );
}
