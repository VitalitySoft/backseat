import Link from "next/link";
import { Bike, Car, MapPin, Users, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SearchForm } from "./search-form";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";
import { TicketShell } from "@/components/ui/ticket-shell";

export const metadata = { title: "Find a Ride — Backseat" };
export const dynamic = "force-dynamic";

export default async function FindARidePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; vehicleType?: string }>;
}) {
  const { from, to, vehicleType } = await searchParams;

  const offers = await prisma.rideOffer.findMany({
    where: {
      status: "ACTIVE",
      rider: { isSharingActive: true, isVehicleVerified: true },
      ...(from ? { startLocation: { contains: from } } : {}),
      ...(to ? { destination: { contains: to } } : {}),
      ...(vehicleType ? { vehicleType } : {}),
    },
    include: { rider: { include: { user: true } }, joins: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-3xl text-ink sm:text-4xl">Find a Ride</h1>
      <p className="mt-3 max-w-xl text-text-soft">
        Every rider here is verified and travelling this route anyway. Join for free — if you
        feel moved to, you can support their charity afterwards.
      </p>

      <div className="mt-8">
        <SearchForm />
      </div>

      <div className="mt-8 space-y-4">
        {offers.length === 0 && (
          <p className="rounded-2xl border border-dashed border-paper-line bg-white px-6 py-10 text-center text-text-soft">
            No matching rides right now. Try a broader search, or check back soon.
          </p>
        )}
        {offers.map((offer) => {
          const Icon = offer.vehicleType === "TWO_WHEELER" ? Bike : Car;
          return (
            <TicketShell
              key={offer.id}
              left={
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-dim text-ink">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <p className="font-display text-lg text-ink">
                      {offer.startLocation} <span className="text-text-soft">→</span> {offer.destination}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-soft">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {VEHICLE_TYPE_LABELS[offer.vehicleType as keyof typeof VEHICLE_TYPE_LABELS]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {offer.seatsAvailable} seat(s)
                    </span>
                    {offer.rider.isVehicleVerified && (
                      <span className="flex items-center gap-1 text-banyan-deep">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified rider
                      </span>
                    )}
                  </div>
                  {offer.notes && <p className="mt-3 text-sm italic text-text-soft">&ldquo;{offer.notes}&rdquo;</p>}
                </div>
              }
              right={
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-text-soft">Offered by</p>
                    <p className="mt-1 font-display text-base text-ink">{offer.rider.user.name}</p>
                  </div>
                  <Link
                    href={`/rides/${offer.id}`}
                    className="mt-4 inline-flex items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-on-ink hover:bg-ink-soft"
                  >
                    View & Join
                  </Link>
                </div>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
