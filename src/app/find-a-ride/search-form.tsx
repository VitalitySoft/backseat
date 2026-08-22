"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VEHICLE_TYPES, VEHICLE_TYPE_LABELS } from "@/lib/constants";

export function SearchForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");
  const [vehicleType, setVehicleType] = useState(params.get("vehicleType") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    if (vehicleType) qs.set("vehicleType", vehicleType);
    router.push(`/find-a-ride?${qs.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-3xl border border-paper-line bg-white p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:p-5">
      <input
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        placeholder="From — e.g. Koramangala"
        className="rounded-xl border border-paper-line bg-white px-4 py-2.5 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
      />
      <input
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="To — e.g. Whitefield"
        className="rounded-xl border border-paper-line bg-white px-4 py-2.5 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
      />
      <select
        value={vehicleType}
        onChange={(e) => setVehicleType(e.target.value)}
        className="rounded-xl border border-paper-line bg-white px-3 py-2.5 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
      >
        <option value="">Any vehicle</option>
        {VEHICLE_TYPES.map((vt) => (
          <option key={vt} value={vt}>
            {VEHICLE_TYPE_LABELS[vt]}
          </option>
        ))}
      </select>
      <Button type="submit" className="justify-center">
        <Search className="h-4 w-4" /> Search
      </Button>
    </form>
  );
}
