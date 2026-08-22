import { ShieldCheck, FileText, Users, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AnimatedCounter } from "@/components/animated-counter";

export const metadata = { title: "Where Your Donation Goes — Backseat" };
export const dynamic = "force-dynamic";

export default async function CharityImpactPage() {
  const charities = await prisma.charity.findMany({
    where: { isActive: true },
    include: { campaigns: { where: { isActive: true } } },
  });

  const campaignIds = charities.flatMap((c) => c.campaigns.map((cp) => cp.id));
  const collectedByCampaign = await prisma.donation.groupBy({
    by: ["campaignId"],
    where: { status: "SUCCESS", campaignId: { in: campaignIds } },
    _sum: { amount: true },
    _count: true,
  });

  const totalCollected = collectedByCampaign.reduce((sum, c) => sum + (c._sum.amount ?? 0), 0);
  const totalDistributed = charities.reduce(
    (sum, c) => sum + c.campaigns.reduce((s, cp) => s + cp.amountDistributed, 0),
    0,
  );
  const totalBeneficiaries = charities.reduce(
    (sum, c) => sum + c.campaigns.reduce((s, cp) => s + cp.beneficiariesSupported, 0),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <h1 className="font-display text-4xl text-ink">Where Your Donation Goes</h1>
        <p className="mx-auto mt-3 max-w-xl text-text-soft">
          Every rupee donated through Backseat goes directly to our registered charity
          partners — never to a rider. Here is exactly how it is used.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-paper-line bg-white p-6 text-center">
          <p className="font-display text-3xl text-ink">
            <AnimatedCounter value={totalCollected} prefix="₹" />
          </p>
          <p className="mt-1 text-sm text-text-soft">Collected via Backseat</p>
        </div>
        <div className="rounded-2xl border border-paper-line bg-white p-6 text-center">
          <p className="font-display text-3xl text-ink">
            <AnimatedCounter value={totalDistributed} prefix="₹" />
          </p>
          <p className="mt-1 text-sm text-text-soft">Distributed to programs to date</p>
        </div>
        <div className="rounded-2xl border border-paper-line bg-white p-6 text-center">
          <p className="font-display text-3xl text-ink">
            <AnimatedCounter value={totalBeneficiaries} />
          </p>
          <p className="mt-1 text-sm text-text-soft">Beneficiaries supported</p>
        </div>
      </div>

      {charities.map((charity) => (
        <div key={charity.id} className="mt-12">
          <div className="rounded-3xl border border-paper-line bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-ink">{charity.name}</h2>
                <p className="mt-1 text-sm text-text-soft">{charity.description}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-banyan-pale px-3 py-1.5 text-xs font-semibold text-banyan-deep">
                <ShieldCheck className="h-3.5 w-3.5" /> Registered charity
              </span>
            </div>
            {charity.registrationNumber && (
              <p className="mt-4 flex items-center gap-1.5 font-mono text-xs text-text-soft">
                <FileText className="h-3.5 w-3.5" /> Registration: {charity.registrationNumber}
              </p>
            )}

            <div className="mt-6 space-y-5">
              {charity.campaigns.map((campaign) => {
                const collected = collectedByCampaign.find((c) => c.campaignId === campaign.id);
                const pct = campaign.goalAmount
                  ? Math.min(100, Math.round(((collected?._sum.amount ?? 0) / campaign.goalAmount) * 100))
                  : null;
                return (
                  <div key={campaign.id} className="rounded-2xl bg-paper-dim/60 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 font-display text-lg text-ink">
                        <Target className="h-4 w-4 text-marigold-deep" /> {campaign.name}
                      </p>
                      <span className="flex items-center gap-1 text-xs text-text-soft">
                        <Users className="h-3.5 w-3.5" /> {campaign.beneficiariesSupported.toLocaleString("en-IN")} beneficiaries
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-soft">{campaign.description}</p>

                    {campaign.goalAmount && (
                      <div className="mt-4">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-paper-line">
                          <div className="h-full rounded-full bg-marigold" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-text-soft">
                          <span>₹{campaign.amountDistributed.toLocaleString("en-IN")} distributed</span>
                          <span>Goal: ₹{campaign.goalAmount.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      <div className="mt-12 rounded-3xl bg-ink px-8 py-10 text-on-ink">
        <h2 className="font-display text-xl">Our transparency commitment</h2>
        <ul className="mt-4 space-y-2 text-sm text-on-ink-soft">
          <li>• Riders never receive donations directly — funds move straight to the registered charity.</li>
          <li>• Every donation carries a unique, auditable transaction reference.</li>
          <li>• Failed or refunded transactions are excluded from all public totals and leaderboards.</li>
          <li>• Utilisation reports are published by our charity partners on a periodic basis.</li>
        </ul>
        <p className="mt-4 text-xs text-on-ink-soft/80">
          Donations made through this platform support registered charitable causes and are not
          automatically eligible for tax deduction unless a specific receipt states otherwise.
          Consult your tax advisor for guidance applicable to you.
        </p>
      </div>
    </div>
  );
}
