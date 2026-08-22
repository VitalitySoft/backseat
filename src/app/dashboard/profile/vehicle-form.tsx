"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function VehicleForm({ initialSeats, initialBio }: { initialSeats: number; initialBio: string }) {
  const router = useRouter();
  const [seats, setSeats] = useState(initialSeats);
  const [bio, setBio] = useState(initialBio);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/rider/vehicle", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatsAvailable: seats, bio }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text">Spare seats</label>
        <input
          type="number"
          min={1}
          max={6}
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={2}
          maxLength={280}
          className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
        />
      </div>
      <Button type="submit" variant="outline" disabled={saving}>
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save vehicle info"}
      </Button>
    </form>
  );
}
