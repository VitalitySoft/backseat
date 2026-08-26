import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, HandHeart, Car, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayNameFor } from "@/lib/stats";

export const metadata = { title: "Payments — Backseat" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: "bg-banyan-pale text-banyan-deep",
  PENDING: "bg-marigold-pale text-marigold-deep",
  FAILED: "bg-rose-pale text-rose-deep",
  REFUNDED: "bg-paper-dim text-text-soft",
};

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/payments");

  const [givenAsPassenger, receivedAsRider] = await Promise.all([
    prisma.donation.findMany({
      where: { passengerId: user.id },
      include: { rider: { include: { user: true } }, campaign: true, rideJoin: { include: { rideOffer: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.donation.findMany({
      where: { riderId: user.riderProfile?.id ?? "__no-rider__" },
      include: { passenger: true, campaign: true, rideJoin: { include: { rideOffer: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const givenTotal = givenAsPassenger.filter((d) => d.status === "SUCCESS").reduce((s, d) => s + d.amount, 0);
  const receivedTotal = receivedAsRider.filter((d) => d.status === "SUCCESS").reduce((s, d) => s + d.amount, 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl text-ink">My Payments</h1>
      <p className="mt-2 text-text-soft">
        Everything you&apos;ve given as a passenger, and everything given through you as a rider —
        in one place, since the same account can be both.
      </p>

      <div className="mt-6 flex items-start gap-2 rounded-2xl bg-banyan-pale px-5 py-4 text-sm text-banyan-deep">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        Every rupee here goes straight to our registered charity partner&apos;s account. A rider
        never receives money directly — they&apos;re only credited by name because they offered
        the seat.
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-paper-line bg-white p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-soft">
            <HandHeart className="h-3.5 w-3.5" /> Given as a passenger
          </p>
          <p className="mt-2 font-display text-2xl text-ink">₹{givenTotal.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl border border-paper-line bg-white p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-soft">
            <Car className="h-3.5 w-3.5" /> Received through your rides
          </p>
          <p className="mt-2 font-display text-2xl text-ink">
            {user.riderProfile ? `₹${receivedTotal.toLocaleString("en-IN")}` : "—"}
          </p>
          {!user.riderProfile && (
            <p className="mt-1 text-xs text-text-soft">
              <Link href="/become-a-rider" className="font-semibold text-marigold-deep hover:underline">
                Become a rider
              </Link>{" "}
              to start receiving these too.
            </p>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl text-ink">As a passenger — what you&apos;ve donated</h2>
        <p className="mt-1 text-sm text-text-soft">Money you gave a rider&apos;s charity after riding with them.</p>
        <div className="mt-4 overflow-hidden rounded-3xl border border-paper-line bg-white">
          {givenAsPassenger.length === 0 && (
            <p className="px-6 py-8 text-center text-text-soft">
              No donations yet.{" "}
              <Link href="/find-a-ride" className="font-semibold text-marigold-deep hover:underline">
                Find a ride →
              </Link>
            </p>
          )}
          <ul className="divide-y divide-paper-line">
            {givenAsPassenger.map((d) => {
              const route = d.rideJoin?.rideOffer
                ? `${d.rideJoin.rideOffer.startLocation} → ${d.rideJoin.rideOffer.destination}`
                : null;
              return (
                <li key={d.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">To {d.rider?.user.name ?? "a rider"}&apos;s charity</p>
                    <p className="mt-0.5 text-xs text-text-soft">
                      {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {d.campaign ? ` · ${d.campaign.name}` : ""}
                    </p>
                    {route ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-marigold-deep">
                        <MapPin className="h-3 w-3" /> {route}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-text-soft/70">Not linked to a specific ride</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="font-display text-base text-ink">₹{d.amount.toLocaleString("en-IN")}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[d.status]}`}>
                      {d.status}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {user.riderProfile && (
        <section className="mt-10">
          <h2 className="font-display text-xl text-ink">As a rider — what came through your QR</h2>
          <p className="mt-1 text-sm text-text-soft">
            Passengers who chose to support the charity after riding with you.
          </p>
          <div className="mt-4 overflow-hidden rounded-3xl border border-paper-line bg-white">
            {receivedAsRider.length === 0 && (
              <p className="px-6 py-8 text-center text-text-soft">No donations received yet.</p>
            )}
            <ul className="divide-y divide-paper-line">
              {receivedAsRider.map((d) => {
                const route = d.rideJoin?.rideOffer
                  ? `${d.rideJoin.rideOffer.startLocation} → ${d.rideJoin.rideOffer.destination}`
                  : null;
                return (
                  <li key={d.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        From{" "}
                        {displayNameFor(
                          d.passenger?.name ?? d.donorDisplayNameSnapshot ?? "A kind traveller",
                          d.passenger?.leaderboardDisplay ?? "ANONYMOUS",
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-text-soft">
                        {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {d.campaign ? ` · ${d.campaign.name}` : ""}
                      </p>
                      {route ? (
                        <p className="mt-1 flex items-center gap-1 text-xs text-marigold-deep">
                          <MapPin className="h-3 w-3" /> {route}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-text-soft/70">Not linked to a specific ride</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="font-display text-base text-ink">₹{d.amount.toLocaleString("en-IN")}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[d.status]}`}>
                        {d.status}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
