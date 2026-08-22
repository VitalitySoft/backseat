import { redirect } from "next/navigation";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "My Charity Impact — Backseat" };
export const dynamic = "force-dynamic";

export default async function ImpactPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/impact");

  const where = user.riderProfile ? { riderId: user.riderProfile.id, status: "SUCCESS" as const } : { passengerId: user.id, status: "SUCCESS" as const };

  const byCampaign = await prisma.donation.groupBy({
    by: ["campaignId"],
    where,
    _sum: { amount: true },
    _count: true,
  });

  const campaigns = await prisma.campaign.findMany({
    where: { id: { in: byCampaign.map((c) => c.campaignId).filter((x): x is string => Boolean(x)) } },
    include: { charity: true },
  });

  const total = byCampaign.reduce((sum, c) => sum + (c._sum.amount ?? 0), 0);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <HeartHandshake className="h-8 w-8 text-marigold-deep" />
      <h1 className="mt-3 font-display text-3xl text-ink">
        {user.riderProfile ? "Your Charity Impact" : "Your Giving Impact"}
      </h1>
      <p className="mt-2 text-text-soft">
        {user.riderProfile
          ? "Because you offered rides freely, here's what your passengers made possible."
          : "Here's where the donations you've made have gone."}
      </p>

      <div className="mt-8 rounded-3xl bg-ink px-8 py-10 text-center text-on-ink">
        <p className="text-xs uppercase tracking-wide text-on-ink-soft">Total contributed</p>
        <p className="mt-2 font-display text-4xl">₹{total.toLocaleString("en-IN")}</p>
      </div>

      <div className="mt-8 space-y-4">
        {campaigns.length === 0 && (
          <p className="rounded-2xl border border-dashed border-paper-line bg-white px-6 py-10 text-center text-text-soft">
            No donations recorded yet.
          </p>
        )}
        {campaigns.map((c) => {
          const stat = byCampaign.find((b) => b.campaignId === c.id);
          return (
            <div key={c.id} className="rounded-2xl border border-paper-line bg-white p-5">
              <p className="font-display text-lg text-ink">{c.name}</p>
              <p className="mt-1 text-sm text-text-soft">{c.description}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-text-soft">{stat?._count ?? 0} donation(s) via you</span>
                <span className="font-semibold text-ink">₹{(stat?._sum.amount ?? 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-sm text-text-soft">
        <Link href="/charity-impact" className="font-semibold text-marigold-deep hover:underline">
          See full platform-wide transparency report →
        </Link>
      </p>
    </div>
  );
}
