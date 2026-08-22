"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminActionButton } from "@/components/admin-action-button";

export function CampaignAmountForm({
  campaignId,
  initialDistributed,
  initialBeneficiaries,
}: {
  campaignId: string;
  initialDistributed: number;
  initialBeneficiaries: number;
}) {
  const router = useRouter();
  const [distributed, setDistributed] = useState(initialDistributed);
  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountDistributed: distributed, beneficiariesSupported: beneficiaries }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-[11px] text-text-soft">Distributed (₹)</label>
        <input
          type="number"
          value={distributed}
          onChange={(e) => setDistributed(Number(e.target.value))}
          className="w-32 rounded-lg border border-paper-line bg-white px-2 py-1.5 text-sm outline-none focus:border-marigold"
        />
      </div>
      <div>
        <label className="block text-[11px] text-text-soft">Beneficiaries</label>
        <input
          type="number"
          value={beneficiaries}
          onChange={(e) => setBeneficiaries(Number(e.target.value))}
          className="w-28 rounded-lg border border-paper-line bg-white px-2 py-1.5 text-sm outline-none focus:border-marigold"
        />
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="rounded-full bg-paper-dim px-3 py-1.5 text-xs font-semibold text-ink hover:bg-marigold-pale disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export function CampaignActiveToggle({ campaignId, isActive }: { campaignId: string; isActive: boolean }) {
  return (
    <AdminActionButton
      url={`/api/admin/campaigns/${campaignId}`}
      body={{ isActive: !isActive }}
      label={isActive ? "Deactivate" : "Activate"}
      tone={isActive ? "danger" : "success"}
    />
  );
}
