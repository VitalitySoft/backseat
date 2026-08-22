import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { VerifiedBadge } from "@/components/verified-badge";
import { ProfileForm } from "./profile-form";
import { VehicleForm } from "./vehicle-form";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";

export const metadata = { title: "Profile — Backseat" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/profile");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-2xl font-semibold text-on-ink">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="font-display text-2xl text-ink">{user.name}</h1>
          <p className="text-sm text-text-soft">
            Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
          <div className="mt-1 flex gap-2">
            {user.emailVerified && <VerifiedBadge label="Email verified" />}
            {user.riderProfile?.isVehicleVerified && <VerifiedBadge label="Vehicle verified" />}
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-paper-line bg-white p-6 sm:p-8">
        <h2 className="font-display text-lg text-ink">Account details</h2>
        <div className="mt-5">
          <ProfileForm
            initialName={user.name}
            initialPhone={user.phone ?? ""}
            initialDisplay={user.leaderboardDisplay}
          />
        </div>
      </div>

      {user.riderProfile && (
        <div className="mt-6 rounded-3xl border border-paper-line bg-white p-6 sm:p-8">
          <h2 className="font-display text-lg text-ink">Vehicle</h2>
          <p className="mt-1 text-sm text-text-soft">
            {VEHICLE_TYPE_LABELS[user.riderProfile.vehicleType as keyof typeof VEHICLE_TYPE_LABELS]} ·{" "}
            {user.riderProfile.vehicleMake} {user.riderProfile.vehicleModel} · {user.riderProfile.vehiclePlate}
          </p>
          <p className="mt-1 text-xs text-text-soft">
            Plate and vehicle model changes require re-verification — contact support to update them.
          </p>
          <div className="mt-5">
            <VehicleForm initialSeats={user.riderProfile.seatsAvailable} initialBio={user.riderProfile.bio ?? ""} />
          </div>
        </div>
      )}
    </div>
  );
}
