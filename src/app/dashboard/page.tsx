import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Bike,
  Users,
  HandHeart,
  Sparkles,
  Navigation,
  Trophy,
  QrCode,
  ListChecks,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRiderDashboardStats } from "@/lib/stats";
import { DonationHistoryChart } from "@/components/donation-history-chart";
import { LinkButton } from "@/components/ui/button";

export const metadata = { title: "Dashboard — Backseat" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  if (!user.riderProfile) {
    const [joins, donationAgg] = await Promise.all([
      prisma.rideJoin.findMany({
        where: { passengerId: user.id },
        include: { rideOffer: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.donation.aggregate({
        where: { passengerId: user.id, status: "SUCCESS" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl text-ink">Welcome, {user.name.split(" ")[0]}</h1>
        <p className="mt-2 text-text-soft">Here&apos;s your travel and giving history so far.</p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <StatCard icon={ListChecks} label="Rides joined" value={joins.length.toString()} />
          <StatCard
            icon={HandHeart}
            label="Total donated"
            value={`₹${(donationAgg._sum.amount ?? 0).toLocaleString("en-IN")}`}
          />
        </div>

        <div className="mt-10 rounded-3xl border border-dashed border-paper-line bg-white p-6 text-center">
          <Bike className="mx-auto h-8 w-8 text-marigold-deep" />
          <p className="mt-3 font-display text-lg text-ink">Already travelling somewhere alone?</p>
          <p className="mt-1 text-sm text-text-soft">
            Register your vehicle and offer your spare seat — no fare, ever.
          </p>
          <div className="mt-4">
            <LinkButton href="/become-a-rider">Become a Charity Rider</LinkButton>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl text-ink">Recent trips</h2>
          <div className="mt-4 space-y-3">
            {joins.length === 0 && <p className="text-text-soft">No trips yet.</p>}
            {joins.map((j) => (
              <div key={j.id} className="rounded-2xl border border-paper-line bg-white px-5 py-4">
                <p className="font-medium text-ink">
                  {j.rideOffer.startLocation} → {j.rideOffer.destination}
                </p>
                <p className="text-xs text-text-soft">{j.status}</p>
              </div>
            ))}
          </div>
          <Link href="/dashboard/my-trips" className="mt-4 inline-block text-sm font-semibold text-marigold-deep hover:underline">
            View all trips →
          </Link>
        </div>
      </div>
    );
  }

  const rider = user.riderProfile;
  const stats = await getRiderDashboardStats(rider.id);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-text-soft">Here&apos;s the impact your journeys have made.</p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/offer-a-ride" size="sm">
            Offer a Ride
          </LinkButton>
          <LinkButton href="/dashboard/qr" variant="outline" size="sm">
            <QrCode className="h-4 w-4" /> Charity QR
          </LinkButton>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={Bike} label="Rides offered" value={stats.ridesOffered.toString()} />
        <StatCard icon={Users} label="People helped" value={stats.peopleHelped.toString()} />
        <StatCard
          icon={HandHeart}
          label="Total donations"
          value={`₹${stats.totalDonated.toLocaleString("en-IN")}`}
        />
        <StatCard icon={Sparkles} label="Charity impact" value={`${stats.donationCount} gifts received`} />
        <StatCard
          icon={Navigation}
          label="Current ride status"
          value={
            stats.currentRide
              ? `${stats.currentRide.startLocation} → ${stats.currentRide.destination}`
              : "Not sharing right now"
          }
          sub={stats.currentRide ? `${stats.currentRide.requestCount} request(s)` : undefined}
        />
        <StatCard
          icon={Trophy}
          label="Top contributor rank"
          value={stats.rank ? `#${stats.rank} of ${stats.totalRiders}` : "Not yet ranked"}
        />
      </div>

      <div className="mt-10 rounded-3xl border border-paper-line bg-white p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink">Donation history</h2>
        <p className="mt-1 text-sm text-text-soft">Every gift given through your charity QR.</p>
        <div className="mt-6">
          <DonationHistoryChart donations={stats.donations} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink href="/dashboard/my-rides" label="My Rides" />
        <QuickLink href="/dashboard/donations" label="Donations" />
        <QuickLink href="/dashboard/impact" label="Impact" />
        <QuickLink href="/dashboard/profile" label="Profile" />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-paper-line bg-white p-5">
      <Icon className="h-5 w-5 text-marigold-deep" />
      <p className="mt-3 font-display text-xl leading-tight text-ink">{value}</p>
      <p className="mt-1 text-xs text-text-soft">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-text-soft/80">{sub}</p>}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-paper-line bg-white px-4 py-3 text-center text-sm font-semibold text-ink hover:border-marigold hover:bg-marigold-pale/30"
    >
      {label}
    </Link>
  );
}
