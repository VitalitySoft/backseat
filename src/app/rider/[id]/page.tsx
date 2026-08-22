import { notFound } from "next/navigation";
import Link from "next/link";
import { Bike, Car, Calendar, Users, HandHeart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRiderRank } from "@/lib/stats";
import { VerifiedBadge } from "@/components/verified-badge";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";
import { ReportBlockActions } from "@/components/report-block-actions";
import { LinkButton } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function RiderPublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [rider, viewer] = await Promise.all([
    prisma.riderProfile.findUnique({
      where: { id },
      include: { user: true, rideOffers: true },
    }),
    getCurrentUser(),
  ]);
  if (!rider) notFound();

  const [donationAgg, rank, activeOffers] = await Promise.all([
    prisma.donation.aggregate({
      where: { riderId: rider.id, status: "SUCCESS" },
      _sum: { amount: true },
      _count: true,
    }),
    getRiderRank(rider.id),
    prisma.rideOffer.findMany({ where: { riderId: rider.id, status: "ACTIVE" }, take: 3 }),
  ]);

  const Icon = rider.vehicleType === "TWO_WHEELER" ? Bike : Car;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="rounded-3xl border border-paper-line bg-white p-8 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-ink text-2xl font-semibold text-on-ink">
          {rider.user.name.charAt(0).toUpperCase()}
        </span>
        <h1 className="mt-4 font-display text-2xl text-ink">{rider.user.name}</h1>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {rider.isVehicleVerified && <VerifiedBadge label="Verified rider" />}
          {rank && <VerifiedBadge label={`#${rank} contributor`} tone="marigold" icon="trophy" />}
        </div>
        {rider.bio && <p className="mx-auto mt-4 max-w-md text-sm text-text-soft">{rider.bio}</p>}

        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-paper-line pt-6 text-center">
          <div>
            <p className="font-display text-xl text-ink">{rider.rideOffers.length}</p>
            <p className="text-xs text-text-soft">Charity rides</p>
          </div>
          <div>
            <p className="font-display text-xl text-ink">₹{(donationAgg._sum.amount ?? 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-text-soft">Donations generated</p>
          </div>
          <div>
            <p className="font-display text-xl text-ink">{new Date(rider.memberSince).getFullYear()}</p>
            <p className="text-xs text-text-soft">Member since</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-paper-line bg-white p-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon className="h-4 w-4" /> {VEHICLE_TYPE_LABELS[rider.vehicleType as keyof typeof VEHICLE_TYPE_LABELS]}
        </p>
        <p className="mt-1 text-sm text-text-soft">
          {rider.vehicleMake} {rider.vehicleModel}
        </p>
      </div>

      {activeOffers.length > 0 && (
        <div className="mt-6">
          <p className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-text-soft">
            <Users className="h-3.5 w-3.5" /> Currently offering
          </p>
          <div className="mt-3 space-y-2">
            {activeOffers.map((o) => (
              <Link
                key={o.id}
                href={`/rides/${o.id}`}
                className="block rounded-xl border border-paper-line bg-white px-4 py-3 text-sm text-ink hover:border-marigold"
              >
                {o.startLocation} → {o.destination}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <LinkButton href={`/donate/${rider.charityCode}`} variant="primary">
          <HandHeart className="h-4 w-4" /> Support their charity
        </LinkButton>
        <LinkButton href="/find-a-ride" variant="outline">
          <Calendar className="h-4 w-4" /> Find their rides
        </LinkButton>
      </div>

      <ReportBlockActions userId={rider.user.id} loggedIn={Boolean(viewer)} />
    </div>
  );
}
