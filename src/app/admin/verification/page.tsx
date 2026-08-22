import { prisma } from "@/lib/prisma";
import { AdminActionButton } from "@/components/admin-action-button";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";

export const metadata = { title: "Admin — Verification" };
export const dynamic = "force-dynamic";

export default async function AdminVerificationPage() {
  const pending = await prisma.riderProfile.findMany({
    where: { isVehicleVerified: false },
    include: { user: true },
    orderBy: { memberSince: "asc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Verification Queue</h1>
      <p className="mt-1 text-sm text-text-soft">
        {pending.length} rider(s) waiting — their charity QR stays inactive until verified.
      </p>

      <div className="mt-6 space-y-4">
        {pending.length === 0 && (
          <p className="rounded-2xl border border-dashed border-paper-line bg-white px-6 py-10 text-center text-text-soft">
            Nothing pending — every rider is verified.
          </p>
        )}
        {pending.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-paper-line bg-white p-5">
            <div>
              <p className="font-display text-lg text-ink">{r.user.name}</p>
              <p className="text-sm text-text-soft">
                {VEHICLE_TYPE_LABELS[r.vehicleType as keyof typeof VEHICLE_TYPE_LABELS]} · {r.vehicleMake} {r.vehicleModel} ·{" "}
                <span className="font-mono">{r.vehiclePlate}</span>
              </p>
              <p className="mt-1 text-xs text-text-soft">{r.user.email}{r.user.phone ? ` · ${r.user.phone}` : ""}</p>
            </div>
            <AdminActionButton
              url={`/api/admin/riders/${r.id}`}
              body={{ isVehicleVerified: true }}
              label="Verify vehicle"
              tone="success"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
