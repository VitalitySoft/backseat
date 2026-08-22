import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { QrDisplay } from "./qr-display";

export const metadata = { title: "Charity QR — Backseat" };
export const dynamic = "force-dynamic";

export default async function CharityQrPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/qr");
  if (!user.riderProfile) redirect("/become-a-rider");

  const rider = user.riderProfile;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-center font-display text-3xl text-ink">Show Charity QR</h1>
      <p className="mx-auto mt-3 max-w-md text-center text-text-soft">
        Hand your phone to your passenger, or let them scan straight off your screen — no
        app download needed on their end.
      </p>

      <div className="mt-10">
        {rider.isVehicleVerified ? (
          <QrDisplay charityCode={rider.charityCode} riderName={user.name} />
        ) : (
          <div className="mx-auto max-w-sm rounded-3xl border border-dashed border-paper-line bg-white p-8 text-center">
            <Clock className="mx-auto h-8 w-8 text-marigold-deep" />
            <p className="mt-3 font-display text-lg text-ink">Verification pending</p>
            <p className="mt-2 text-sm text-text-soft">
              Your charity QR activates automatically once our team verifies your vehicle
              details. This usually takes less than a day.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
