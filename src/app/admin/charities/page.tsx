import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CharityConfigForm } from "./charity-config-form";
import { CampaignAmountForm, CampaignActiveToggle } from "./campaign-form";

export const metadata = { title: "Admin — Charities & Campaigns" };
export const dynamic = "force-dynamic";

export default async function AdminCharitiesPage() {
  const charities = await prisma.charity.findMany({ include: { campaigns: true } });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Charities &amp; Campaigns</h1>
      <p className="mt-1 max-w-xl text-sm text-text-soft">
        This is the only place the donation beneficiary can be changed. Riders have no access to
        this configuration anywhere in the product.
      </p>

      <div className="mt-6 space-y-6">
        {charities.map((c) => (
          <div key={c.id} className="rounded-2xl border border-paper-line bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg text-ink">{c.name}</h2>
              <span className="flex items-center gap-1.5 rounded-full bg-banyan-pale px-3 py-1 text-xs font-semibold text-banyan-deep">
                <ShieldCheck className="h-3.5 w-3.5" /> {c.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-soft">{c.description}</p>
            <CharityConfigForm charityId={c.id} initialVpa={c.beneficiaryUpiVpa} initialName={c.beneficiaryName} />

            <div className="mt-6 space-y-4 border-t border-paper-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">Campaigns</p>
              {c.campaigns.map((cp) => (
                <div key={cp.id} className="rounded-xl bg-paper-dim/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-ink">{cp.name}</p>
                    <CampaignActiveToggle campaignId={cp.id} isActive={cp.isActive} />
                  </div>
                  <p className="mt-1 text-xs text-text-soft">
                    Goal: ₹{(cp.goalAmount ?? 0).toLocaleString("en-IN")}
                  </p>
                  <CampaignAmountForm
                    campaignId={cp.id}
                    initialDistributed={cp.amountDistributed}
                    initialBeneficiaries={cp.beneficiariesSupported}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
