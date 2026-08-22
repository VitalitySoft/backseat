import Link from "next/link";
import {
  Users,
  Bike,
  Route,
  HandHeart,
  HeartHandshake,
  CalendarClock,
  CalendarDays,
  Flag,
  ShieldAlert,
} from "lucide-react";
import { getAdminOverview, getLeaderboard } from "@/lib/stats";

export const metadata = { title: "Admin Overview — Backseat" };

export default async function AdminOverviewPage() {
  const [stats, leaderboard] = await Promise.all([getAdminOverview(), getLeaderboard(5)]);

  const cards = [
    { icon: Users, label: "Total users", value: stats.totalUsers.toLocaleString("en-IN") },
    { icon: Bike, label: "Active riders", value: stats.activeRiders.toLocaleString("en-IN") },
    { icon: Route, label: "Total charity rides", value: stats.totalRides.toLocaleString("en-IN") },
    { icon: HandHeart, label: "Total donations", value: `₹${stats.totalDonated.toLocaleString("en-IN")}` },
    { icon: HeartHandshake, label: "People helped", value: stats.peopleHelped.toLocaleString("en-IN") },
    { icon: CalendarClock, label: "Today's donations", value: `₹${stats.todayDonated.toLocaleString("en-IN")}` },
    { icon: CalendarDays, label: "This month's donations", value: `₹${stats.monthDonated.toLocaleString("en-IN")}` },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Platform Overview</h1>

      {(stats.openReports > 0 || stats.pendingVerification > 0) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {stats.openReports > 0 && (
            <Link
              href="/admin/reports"
              className="flex items-center gap-2 rounded-xl bg-rose-pale px-4 py-2.5 text-sm font-semibold text-rose-deep"
            >
              <Flag className="h-4 w-4" /> {stats.openReports} open report(s)
            </Link>
          )}
          {stats.pendingVerification > 0 && (
            <Link
              href="/admin/verification"
              className="flex items-center gap-2 rounded-xl bg-marigold-pale px-4 py-2.5 text-sm font-semibold text-marigold-deep"
            >
              <ShieldAlert className="h-4 w-4" /> {stats.pendingVerification} rider(s) awaiting verification
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-paper-line bg-white p-5">
            <c.icon className="h-5 w-5 text-marigold-deep" />
            <p className="mt-3 font-display text-xl text-ink">{c.value}</p>
            <p className="mt-1 text-xs text-text-soft">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-paper-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Top Contributors</h2>
          <Link href="/admin/leaderboard" className="text-sm font-semibold text-marigold-deep hover:underline">
            Manage leaderboard →
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {leaderboard.map((entry, i) => (
            <div key={entry.riderId} className="flex items-center justify-between rounded-xl bg-paper-dim/60 px-4 py-3 text-sm">
              <span className="text-ink">
                #{i + 1} {entry.displayName}
              </span>
              <span className="font-semibold text-ink">₹{entry.totalDonated.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
