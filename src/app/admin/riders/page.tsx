import { prisma } from "@/lib/prisma";
import { AdminActionButton } from "@/components/admin-action-button";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";

export const metadata = { title: "Admin — Riders & Vehicles" };
export const dynamic = "force-dynamic";

export default async function AdminRidersPage() {
  const riders = await prisma.riderProfile.findMany({
    include: { user: true },
    orderBy: { memberSince: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Riders &amp; Vehicles</h1>
      <p className="mt-1 text-sm text-text-soft">{riders.length} registered rider(s)</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-paper-line bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-paper-line bg-paper-dim/50 text-xs uppercase tracking-wide text-text-soft">
            <tr>
              <th className="px-4 py-3">Rider</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Plate</th>
              <th className="px-4 py-3">Sharing</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Leaderboard</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line">
            {riders.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-ink">{r.user.name}</td>
                <td className="px-4 py-3 text-text-soft">
                  {VEHICLE_TYPE_LABELS[r.vehicleType as keyof typeof VEHICLE_TYPE_LABELS]} · {r.vehicleMake} {r.vehicleModel}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text-soft">{r.vehiclePlate}</td>
                <td className="px-4 py-3">{r.isSharingActive ? "On" : "Off"}</td>
                <td className="px-4 py-3">
                  <span className={r.isVehicleVerified ? "text-banyan-deep" : "text-marigold-deep"}>
                    {r.isVehicleVerified ? "Verified" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-3">{r.hiddenFromLeaderboard ? "Hidden" : "Visible"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <AdminActionButton
                      url={`/api/admin/riders/${r.id}`}
                      body={{ isVehicleVerified: !r.isVehicleVerified }}
                      label={r.isVehicleVerified ? "Unverify" : "Verify"}
                      tone={r.isVehicleVerified ? "danger" : "success"}
                    />
                    <AdminActionButton
                      url={`/api/admin/riders/${r.id}`}
                      body={{ hiddenFromLeaderboard: !r.hiddenFromLeaderboard }}
                      label={r.hiddenFromLeaderboard ? "Unhide" : "Hide"}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
