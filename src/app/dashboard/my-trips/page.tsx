import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, QrCode, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDeparture } from "@/lib/format";
import { ChatPanel } from "@/components/chat-panel";

export const metadata = { title: "My Trips — Backseat" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  REQUESTED: "bg-marigold-pale text-marigold-deep",
  ACCEPTED: "bg-banyan-pale text-banyan-deep",
  DECLINED: "bg-rose-pale text-rose-deep",
  COMPLETED: "bg-paper-dim text-text-soft",
  CANCELLED: "bg-paper-dim text-text-soft",
};

const STATUS_MESSAGES: Record<string, string> = {
  REQUESTED: "Waiting for the rider to respond.",
  ACCEPTED: "You're confirmed for this ride!",
  DECLINED: "The rider wasn't able to take you this time.",
  COMPLETED: "This ride is complete.",
  CANCELLED: "This request was cancelled.",
};

export default async function MyTripsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/my-trips");

  const joins = await prisma.rideJoin.findMany({
    where: { passengerId: user.id },
    include: {
      rideOffer: { include: { rider: { include: { user: true } } } },
      donations: { where: { status: "SUCCESS" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl text-ink">My Trips</h1>
      <p className="mt-2 text-text-soft">Rides you&apos;ve requested to join, and their status.</p>

      {joins.length === 0 && (
        <p className="mt-10 rounded-2xl border border-dashed border-paper-line bg-white px-6 py-10 text-center text-text-soft">
          You haven&apos;t joined a ride yet.{" "}
          <Link href="/find-a-ride" className="font-semibold text-marigold-deep hover:underline">
            Find a ride →
          </Link>
        </p>
      )}

      <div className="mt-8 space-y-4">
        {joins.map((join) => {
          const donated = join.donations.reduce((sum, d) => sum + d.amount, 0);
          return (
            <div key={join.id} className="rounded-2xl border border-paper-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 font-display text-lg text-ink">
                    <MapPin className="h-4 w-4 text-marigold-deep" />
                    {join.rideOffer.startLocation} → {join.rideOffer.destination}
                  </p>
                  <p className="mt-1 text-xs text-text-soft">with {join.rideOffer.rider.user.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-text-soft">
                    <Clock className="h-3.5 w-3.5" /> {formatDeparture(join.rideOffer.departureAt)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[join.status]}`}>
                  {join.status}
                </span>
              </div>

              <p className="mt-3 text-sm text-text-soft">{STATUS_MESSAGES[join.status]}</p>
              {donated > 0 && (
                <p className="mt-1 text-sm font-medium text-marigold-deep">
                  You&apos;ve donated ₹{donated.toLocaleString("en-IN")} for this ride. Thank you!
                </p>
              )}

              {join.status === "COMPLETED" && (
                <Link
                  href={`/donate/${join.rideOffer.rider.charityCode}?join=${join.id}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-marigold px-4 py-2 text-sm font-semibold text-ink hover:bg-marigold-deep"
                >
                  <QrCode className="h-4 w-4" /> Support this rider&apos;s charity
                </Link>
              )}

              {["REQUESTED", "ACCEPTED", "COMPLETED"].includes(join.status) && (
                <div className="mt-4">
                  <ChatPanel
                    rideId={join.rideOfferId}
                    joinId={join.id}
                    currentUserId={user.id}
                    otherPartyName={join.rideOffer.rider.user.name}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
