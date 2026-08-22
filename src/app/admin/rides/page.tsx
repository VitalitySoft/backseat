import { prisma } from "@/lib/prisma";
import { AdminActionButton } from "@/components/admin-action-button";

export const metadata = { title: "Admin — Ride Offers" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "text-banyan-deep",
  COMPLETED: "text-text-soft",
  CANCELLED: "text-rose-deep",
};

export default async function AdminRidesPage() {
  const offers = await prisma.rideOffer.findMany({
    include: { rider: { include: { user: true } }, joins: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Ride Offers</h1>
      <p className="mt-1 text-sm text-text-soft">{offers.length} offer(s) recorded</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-paper-line bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-paper-line bg-paper-dim/50 text-xs uppercase tracking-wide text-text-soft">
            <tr>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Rider</th>
              <th className="px-4 py-3">Requests</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line">
            {offers.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 text-ink">{o.startLocation} → {o.destination}</td>
                <td className="px-4 py-3 text-text-soft">{o.rider.user.name}</td>
                <td className="px-4 py-3 text-text-soft">{o.joins.length}</td>
                <td className={`px-4 py-3 font-medium ${STATUS_STYLES[o.status]}`}>{o.status}</td>
                <td className="px-4 py-3">
                  {o.status === "ACTIVE" && (
                    <AdminActionButton
                      url={`/api/admin/rides/${o.id}`}
                      body={{ status: "CANCELLED" }}
                      label="Force cancel"
                      tone="danger"
                      confirmMessage="Cancel this ride offer?"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
