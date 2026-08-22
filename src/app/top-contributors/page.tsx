import Link from "next/link";
import { Trophy, Heart } from "lucide-react";
import { getLeaderboard, getPlatformStats, getLifetimeContributorCount } from "@/lib/stats";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";

export const metadata = { title: "Top Contributors — Backseat" };
export const dynamic = "force-dynamic";

export default async function TopContributorsPage() {
  const [leaderboard, stats, lifetimeContributors] = await Promise.all([
    getLeaderboard(50),
    getPlatformStats(),
    getLifetimeContributorCount(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <Trophy className="mx-auto h-9 w-9 text-marigold-deep" />
        <h1 className="mt-3 font-display text-4xl text-ink">Top Contributors</h1>
        <p className="mx-auto mt-3 max-w-lg text-text-soft">
          Ranked purely by voluntary donations already received. This is not a competition and
          giving is never required — it&apos;s simply a way to celebrate generosity.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total donated", value: `₹${stats.totalDonated.toLocaleString("en-IN")}` },
          { label: "Charity rides", value: stats.totalRides.toLocaleString("en-IN") },
          { label: "People helped", value: stats.peopleHelped.toLocaleString("en-IN") },
          { label: "Monthly contributors", value: stats.monthlyContributors.toLocaleString("en-IN") },
          { label: "Lifetime contributors", value: lifetimeContributors.toLocaleString("en-IN") },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-paper-line bg-white px-3 py-4 text-center">
            <p className="font-display text-lg text-ink">{s.value}</p>
            <p className="mt-1 text-[11px] text-text-soft">{s.label}</p>
          </div>
        ))}
      </div>

      <ol className="mt-10 space-y-3">
        {leaderboard.map((entry, i) => (
          <li key={entry.riderId}>
            <Link
              href={`/rider/${entry.riderId}`}
              className="flex items-center gap-4 rounded-2xl border border-paper-line bg-white px-5 py-4 transition-colors hover:border-marigold"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm ${
                  i === 0
                    ? "bg-marigold text-ink"
                    : i === 1
                      ? "bg-marigold-pale text-marigold-deep"
                      : i === 2
                        ? "bg-rose-pale text-rose-deep"
                        : "bg-paper-dim text-text-soft"
                }`}
              >
                {i + 1}
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-on-ink">
                {entry.avatarInitial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{entry.displayName}</p>
                <p className="text-xs text-text-soft">
                  {VEHICLE_TYPE_LABELS[entry.vehicleType as keyof typeof VEHICLE_TYPE_LABELS]} rider ·{" "}
                  {entry.donationCount} donations received
                </p>
              </div>
              <span className="font-display text-lg text-ink">₹{entry.totalDonated.toLocaleString("en-IN")}</span>
            </Link>
          </li>
        ))}
        {leaderboard.length === 0 && (
          <p className="rounded-2xl border border-dashed border-paper-line bg-white px-6 py-10 text-center text-text-soft">
            No donations recorded yet — be the first to make a difference.
          </p>
        )}
      </ol>

      <div className="mt-10 flex items-start gap-3 rounded-2xl bg-banyan-pale px-5 py-4 text-sm text-banyan-deep">
        <Heart className="mt-0.5 h-4 w-4 shrink-0" />
        Donating is entirely optional. Riders never see this leaderboard as a target, and no one
        is ever asked to give more than they wish to.
      </div>
    </div>
  );
}
