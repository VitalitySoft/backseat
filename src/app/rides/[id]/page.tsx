import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Bike, Car, ShieldCheck, MapPin, Users, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";
import { formatDeparture, hasDeparted } from "@/lib/format";
import { JoinButton } from "./join-button";

export const dynamic = "force-dynamic";

export default async function RideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [offer, user] = await Promise.all([
    prisma.rideOffer.findUnique({
      where: { id },
      include: { rider: { include: { user: true } } },
    }),
    getCurrentUser(),
  ]);

  if (!offer) notFound();
  if (user?.role === "ADMIN") redirect("/admin");

  const Icon = offer.vehicleType === "TWO_WHEELER" ? Bike : Car;
  const isOwnRide = user?.riderProfile?.id === offer.riderId;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm text-text-soft">
        <Link href="/find-a-ride" className="hover:underline">
          ← Back to Find a Ride
        </Link>
      </p>

      <div className="mt-4 rounded-3xl border border-paper-line bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-dim text-ink">
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display text-2xl text-ink">
              {offer.startLocation} → {offer.destination}
            </p>
            <p className="text-sm text-text-soft">
              {VEHICLE_TYPE_LABELS[offer.vehicleType as keyof typeof VEHICLE_TYPE_LABELS]} ·{" "}
              {offer.status === "ACTIVE" ? "Open for requests" : offer.status}
            </p>
          </div>
        </div>

        {offer.notes && (
          <p className="mt-5 rounded-xl bg-paper-dim/60 px-4 py-3 text-sm italic text-text-soft">
            &ldquo;{offer.notes}&rdquo;
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-soft">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {formatDeparture(offer.departureAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" /> {offer.seatsAvailable} seat(s) available
          </span>
          {offer.rider.isVehicleVerified && (
            <span className="flex items-center gap-1.5 text-banyan-deep">
              <ShieldCheck className="h-4 w-4" /> Vehicle verified
            </span>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-paper-line pt-6">
          <Link
            href={`/rider/${offer.rider.id}`}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-sm font-semibold text-on-ink"
          >
            {offer.rider.user.name.charAt(0).toUpperCase()}
          </Link>
          <div>
            <Link href={`/rider/${offer.rider.id}`} className="font-medium text-ink hover:underline">
              {offer.rider.user.name}
            </Link>
            <p className="text-xs text-text-soft">
              {offer.rider.vehicleMake} {offer.rider.vehicleModel} · Member since{" "}
              {new Date(offer.rider.memberSince).getFullYear()}
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-start gap-2 rounded-xl bg-banyan-pale px-4 py-3 text-xs text-banyan-deep">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          This ride is offered freely — there is no fare. If you&apos;d like, you can support the
          rider&apos;s charity with a voluntary donation after the trip.
        </div>

        <div className="mt-6">
          {isOwnRide ? (
            <p className="rounded-2xl bg-paper-dim px-5 py-4 text-sm text-text-soft">
              This is your own ride offer. Manage requests from{" "}
              <Link href="/dashboard/my-rides" className="font-semibold text-marigold-deep hover:underline">
                My Rides
              </Link>
              .
            </p>
          ) : offer.status !== "ACTIVE" || hasDeparted(offer.departureAt) ? (
            <p className="rounded-2xl bg-paper-dim px-5 py-4 text-sm text-text-soft">
              This ride is no longer accepting requests.
            </p>
          ) : (
            <JoinButton rideId={offer.id} loggedIn={Boolean(user)} />
          )}
        </div>
      </div>
    </div>
  );
}
