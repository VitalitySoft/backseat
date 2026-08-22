import { prisma } from "@/lib/prisma";
import { AdminActionButton } from "@/components/admin-action-button";

export const metadata = { title: "Admin — Donations" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: "text-banyan-deep",
  PENDING: "text-marigold-deep",
  FAILED: "text-rose-deep",
  REFUNDED: "text-text-soft",
};

export default async function AdminDonationsPage() {
  const donations = await prisma.donation.findMany({
    include: { rider: { include: { user: true } }, passenger: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Donations &amp; Transactions</h1>
      <p className="mt-1 text-sm text-text-soft">{donations.length} transaction(s) recorded</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-paper-line bg-white">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-paper-line bg-paper-dim/50 text-xs uppercase tracking-wide text-text-soft">
            <tr>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Rider</th>
              <th className="px-4 py-3">Donor</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line">
            {donations.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-mono text-xs text-text-soft">{d.donationRef}</td>
                <td className="px-4 py-3 text-ink">{d.rider?.user.name ?? "—"}</td>
                <td className="px-4 py-3 text-text-soft">{d.passenger?.name ?? d.donorDisplayNameSnapshot ?? "Anonymous"}</td>
                <td className="px-4 py-3 font-semibold text-ink">₹{d.amount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-text-soft">{new Date(d.createdAt).toLocaleDateString("en-IN")}</td>
                <td className={`px-4 py-3 font-medium ${STATUS_STYLES[d.status]}`}>{d.status}</td>
                <td className="px-4 py-3">
                  {d.status === "SUCCESS" && (
                    <AdminActionButton
                      url={`/api/admin/donations/${d.id}`}
                      body={{ status: "REFUNDED" }}
                      label="Mark refunded"
                      tone="danger"
                      confirmMessage="Mark this donation as refunded? It will be removed from leaderboards and totals."
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
