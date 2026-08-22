"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VEHICLE_TYPES, VEHICLE_TYPE_LABELS, type VehicleType } from "@/lib/constants";

export function BecomeARiderForm() {
  const router = useRouter();
  const [vehicleType, setVehicleType] = useState<VehicleType>("TWO_WHEELER");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [seatsAvailable, setSeatsAvailable] = useState(1);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/rider/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleType, vehicleMake, vehicleModel, vehiclePlate, seatsAvailable, bio }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }
    router.push("/dashboard?onboarded=1");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-text">Vehicle type</label>
        <div className="grid grid-cols-2 gap-3">
          {VEHICLE_TYPES.map((vt) => {
            const Icon = vt === "TWO_WHEELER" ? Bike : Car;
            return (
              <button
                type="button"
                key={vt}
                onClick={() => setVehicleType(vt)}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-5 transition-colors ${
                  vehicleType === vt
                    ? "border-marigold bg-marigold-pale/40"
                    : "border-paper-line bg-white hover:border-paper-line"
                }`}
              >
                <Icon className={`h-7 w-7 ${vehicleType === vt ? "text-marigold-deep" : "text-text-soft"}`} />
                <span className="text-sm font-semibold text-ink">{VEHICLE_TYPE_LABELS[vt]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Make</label>
          <input
            required
            value={vehicleMake}
            onChange={(e) => setVehicleMake(e.target.value)}
            placeholder="Honda"
            className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Model</label>
          <input
            required
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
            placeholder="Activa"
            className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Registration plate</label>
          <input
            required
            value={vehiclePlate}
            onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
            placeholder="KA 05 MJ 4471"
            className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm uppercase outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Spare seats</label>
          <input
            required
            type="number"
            min={1}
            max={6}
            value={seatsAvailable}
            onChange={(e) => setSeatsAvailable(Number(e.target.value))}
            className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text">A line about you (optional)</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="I drive to Whitefield most weekday mornings and enjoy the company."
          className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
        />
      </div>

      <div className="rounded-2xl bg-banyan-pale px-4 py-3 text-sm text-banyan-deep">
        There&apos;s no field here for a fare or fee — Backseat never lets a rider set one.
        After you submit, our team verifies your vehicle before your charity QR goes live.
      </div>

      {error && <p className="rounded-xl bg-rose-pale px-4 py-2.5 text-sm text-rose-deep">{error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Submitting…" : "Become a Charity Rider"}
      </Button>
    </form>
  );
}
