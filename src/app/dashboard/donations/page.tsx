import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayNameFor } from "@/lib/stats";

export const metadata = { title: "Donations — Backseat" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: "bg-banyan-pale text-banyan-deep",
  PENDING: "bg-marigold-pale text-marigold-deep",
  FAILED: "bg-rose-pale text-rose-deep",
  REFUNDED: "bg-paper-dim text-text-soft",
};

export default async function DonationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/donations");

  const donations = user.riderProfile
    ? await prisma.donation.findMany({
        where: { riderId: user.riderProfile.id },
        include: { passenger: true, campaign: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : await prisma.donation.findMany({
        where: { passengerId: user.id },
        include: { rider: { include: { user: true } }, campaign: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl text-ink">
        {user.riderProfile ? "Donations Received" : "Donations Given"}
      </h1>
      <p className="mt-2 text-text-soft">
        {user.riderProfile
          ? "Every voluntary gift given through your charity QR."
          : "Your giving history across every ride."}
      </p>

      <div className="mt-8 overflow-hidden rounded-3xl border border-paper-line bg-white">
        {donations.length === 0 && (
          <p className="px-6 py-10 text-center text-text-soft">No donations yet.</p>
        )}
        <ul className="divide-y divide-paper-line">
          {donations.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {user.riderProfile
                    ? "passenger" in d
                      ? displayNameFor(
                          d.passenger?.name ?? d.donorDisplayNameSnapshot ?? "A kind traveller",
                          d.passenger?.leaderboardDisplay ?? "ANONYMOUS",
                        )
                      : d.donorDisplayNameSnapshot
                    : "rider" in d
                      ? d.rider?.user.name
                      : "—"}
                </p>
                <p className="mt-0.5 text-xs text-text-soft">
                  {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {d.campaign ? ` · ${d.campaign.name}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-display text-base text-ink">₹{d.amount.toLocaleString("en-IN")}</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[d.status]}`}>
                  {d.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
