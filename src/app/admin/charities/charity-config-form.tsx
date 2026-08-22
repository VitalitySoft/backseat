"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CharityConfigForm({
  charityId,
  initialVpa,
  initialName,
}: {
  charityId: string;
  initialVpa: string;
  initialName: string;
}) {
  const router = useRouter();
  const [vpa, setVpa] = useState(initialVpa);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("Changing the beneficiary account affects where ALL future donations for this charity are sent. Continue?")) return;
    setSaving(true);
    await fetch(`/api/admin/charities/${charityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beneficiaryUpiVpa: vpa, beneficiaryName: name }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <div>
        <label className="mb-1 block text-xs text-text-soft">Beneficiary UPI VPA</label>
        <input
          value={vpa}
          onChange={(e) => setVpa(e.target.value)}
          className="w-full rounded-xl border border-paper-line bg-white px-3 py-2 font-mono text-sm outline-none focus:border-marigold"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-soft">Beneficiary name (shown on payment)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-paper-line bg-white px-3 py-2 text-sm outline-none focus:border-marigold"
        />
      </div>
      <div className="flex items-end">
        <Button type="submit" size="sm" variant="danger" disabled={saving}>
          {saving ? "Saving…" : saved ? "Saved ✓" : "Update beneficiary"}
        </Button>
      </div>
    </form>
  );
}
