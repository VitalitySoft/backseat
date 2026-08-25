import Link from "next/link";
import { redirect } from "next/navigation";
import { Bike, Car, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/components/ui/button";
import { SharingToggle } from "@/components/sharing-toggle";
import { OfferRideForm } from "./offer-ride-form";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";

export const metadata = { title: "Offer a Ride — Backseat" };
export const dynamic = "force-dynamic";

export default async function OfferARidePage() {
  const user = await getCurrentUser();

  if (user?.role === "ADMIN") redirect("/admin");

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <Bike className="mx-auto h-10 w-10 text-marigold-deep" />
        <h1 className="mt-4 font-display text-3xl text-ink">Offer a Ride</h1>
        <p className="mt-3 text-text-soft">
          Log in or create a free account to start sharing your spare seat with someone going
          your way.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <LinkButton href="/login?next=/offer-a-ride">Log in</LinkButton>
          <LinkButton href="/register" variant="outline">
            Create an account
          </LinkButton>
        </div>
      </div>
    );
  }

  if (!user.riderProfile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <Car className="mx-auto h-10 w-10 text-marigold-deep" />
        <h1 className="mt-4 font-display text-3xl text-ink">Become a Charity Rider first</h1>
        <p className="mt-3 text-text-soft">
          Add your vehicle details once — no fare or fee to configure — and you&apos;ll be ready
          to offer rides whenever you&apos;re travelling.
        </p>
        <div className="mt-8">
          <LinkButton href="/become-a-rider">Add my vehicle</LinkButton>
        </div>
      </div>
    );
  }

  const rider = user.riderProfile;
  const activeOffers = await prisma.rideOffer.findMany({
    where: { riderId: rider.id, status: "ACTIVE" },
    include: { joins: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl text-ink sm:text-4xl">Offer a Ride</h1>
      <p className="mt-3 text-text-soft">
        {VEHICLE_TYPE_LABELS[rider.vehicleType as keyof typeof VEHICLE_TYPE_LABELS]} ·{" "}
        {rider.vehicleMake} {rider.vehicleModel} · {rider.seatsAvailable} seat(s)
      </p>

      <div className="mt-6">
        <SharingToggle initialActive={rider.isSharingActive} isVerified={rider.isVehicleVerified} />
      </div>

      {!rider.isVehicleVerified && (
        <div className="mt-4 rounded-2xl bg-marigold-pale/60 px-5 py-4 text-sm text-marigold-deep">
          Your vehicle is awaiting verification by our team. You can prepare your ride details
          below, but sharing will switch on automatically once you&apos;re verified.
        </div>
      )}

      <div className="mt-8 rounded-3xl border border-paper-line bg-white p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink">Publish a new ride</h2>
        <div className="mt-5">
          <OfferRideForm maxSeats={rider.seatsAvailable} />
        </div>
      </div>

      {activeOffers.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-ink">Your active rides</h2>
          <div className="mt-4 space-y-3">
            {activeOffers.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-2xl border border-paper-line bg-white px-5 py-4"
              >
                <div>
                  <p className="font-medium text-ink">
                    {o.startLocation} → {o.destination}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-soft">
                    <Users className="h-3.5 w-3.5" /> {o.joins.length} request(s) so far
                  </p>
                </div>
                <Link
                  href="/dashboard/my-rides"
                  className="text-sm font-semibold text-marigold-deep hover:underline"
                >
                  Manage →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
