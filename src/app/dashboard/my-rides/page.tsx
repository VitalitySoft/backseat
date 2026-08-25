import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JoinRequestActions, JoinCompletionPanel, RideOfferStatusButton } from "./ride-actions";

export const metadata = { title: "My Rides — Backseat" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-banyan-pale text-banyan-deep",
  COMPLETED: "bg-paper-dim text-text-soft",
  CANCELLED: "bg-rose-pale text-rose-deep",
};

const JOIN_STATUS_STYLES: Record<string, string> = {
  REQUESTED: "bg-marigold-pale text-marigold-deep",
  ACCEPTED: "bg-banyan-pale text-banyan-deep",
  DECLINED: "bg-rose-pale text-rose-deep",
  COMPLETED: "bg-paper-dim text-text-soft",
  CANCELLED: "bg-paper-dim text-text-soft",
};

export default async function MyRidesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/my-rides");
  if (!user.riderProfile) redirect("/become-a-rider");
  const rider = user.riderProfile;

  const offers = await prisma.rideOffer.findMany({
    where: { riderId: rider.id },
    include: { joins: { include: { passenger: true }, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-ink">My Rides</h1>
        <Link href="/offer-a-ride" className="text-sm font-semibold text-marigold-deep hover:underline">
          + Offer a new ride
        </Link>
      </div>

      {offers.length === 0 && (
        <p className="mt-10 rounded-2xl border border-dashed border-paper-line bg-white px-6 py-10 text-center text-text-soft">
          You haven&apos;t offered a ride yet.{" "}
          <Link href="/offer-a-ride" className="font-semibold text-marigold-deep hover:underline">
            Offer your first ride →
          </Link>
        </p>
      )}

      <div className="mt-8 space-y-6">
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-3xl border border-paper-line bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-display text-lg text-ink">
                  <MapPin className="h-4 w-4 text-marigold-deep" />
                  {offer.startLocation} → {offer.destination}
                </p>
                <p className="mt-1 text-xs text-text-soft">
                  {offer.seatsAvailable} seat(s) · Offered{" "}
                  {new Date(offer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[offer.status]}`}>
                {offer.status}
              </span>
            </div>

            {offer.status === "ACTIVE" && (
              <div className="mt-4">
                <RideOfferStatusButton rideId={offer.id} status="COMPLETED" />{" "}
                <RideOfferStatusButton rideId={offer.id} status="CANCELLED" />
              </div>
            )}

            <div className="mt-5 border-t border-paper-line pt-4">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-soft">
                <Users className="h-3.5 w-3.5" /> Ride requests ({offer.joins.length})
              </p>
              {offer.joins.length === 0 && (
                <p className="text-sm text-text-soft">No requests yet.</p>
              )}
              <div className="space-y-2">
                {offer.joins.map((join) => (
                  <div key={join.id} className="rounded-xl bg-paper-dim/60 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-on-ink">
                          {join.passenger.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-ink">{join.passenger.name}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${JOIN_STATUS_STYLES[join.status]}`}>
                            {join.status}
                          </span>
                        </div>
                      </div>
                      {join.status === "REQUESTED" && (
                        <JoinRequestActions rideId={offer.id} joinId={join.id} />
                      )}
                      {(join.status === "ACCEPTED" || join.status === "COMPLETED") && (
                        <JoinCompletionPanel
                          rideId={offer.id}
                          joinId={join.id}
                          status={join.status}
                          charityCode={rider.charityCode}
                          riderName={user.name}
                          isVehicleVerified={rider.isVehicleVerified}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
