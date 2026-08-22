import { prisma } from "@/lib/prisma";
import { AdminActionButton } from "@/components/admin-action-button";
import { displayNameFor } from "@/lib/stats";

export const metadata = { title: "Admin — Leaderboard" };
export const dynamic = "force-dynamic";

export default async function AdminLeaderboardPage() {
  const grouped = await prisma.donation.groupBy({
    by: ["riderId"],
    where: { status: "SUCCESS", riderId: { not: null } },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: "desc" } },
    take: 100,
  });

  const riders = await prisma.riderProfile.findMany({
    where: { id: { in: grouped.map((g) => g.riderId!).filter(Boolean) } },
    include: { user: true },
  });
  const riderMap = new Map(riders.map((r) => [r.id, r]));

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Leaderboard Management</h1>
      <p className="mt-1 max-w-xl text-sm text-text-soft">
        Ranking is computed automatically from successful donations only. You can hide a rider
        from the public leaderboard during an investigation without affecting their real totals.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-paper-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-paper-line bg-paper-dim/50 text-xs uppercase tracking-wide text-text-soft">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Rider</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Donations</th>
              <th className="px-4 py-3">Public visibility</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line">
            {grouped.map((g, i) => {
              const rider = riderMap.get(g.riderId!);
              if (!rider) return null;
              return (
                <tr key={g.riderId}>
                  <td className="px-4 py-3 text-text-soft">#{i + 1}</td>
                  <td className="px-4 py-3 text-ink">
                    {rider.user.name} <span className="text-xs text-text-soft">({displayNameFor(rider.user.name, rider.user.leaderboardDisplay)})</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">₹{(g._sum.amount ?? 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-text-soft">{g._count}</td>
                  <td className="px-4 py-3">{rider.hiddenFromLeaderboard ? "Hidden" : "Visible"}</td>
                  <td className="px-4 py-3">
                    <AdminActionButton
                      url={`/api/admin/riders/${rider.id}`}
                      body={{ hiddenFromLeaderboard: !rider.hiddenFromLeaderboard }}
                      label={rider.hiddenFromLeaderboard ? "Show publicly" : "Hide from public"}
                      tone={rider.hiddenFromLeaderboard ? "success" : "danger"}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
