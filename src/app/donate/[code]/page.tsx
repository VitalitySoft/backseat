import { notFound } from "next/navigation";
import { HeartHandshake, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { DonateForm } from "./donate-form";

export const dynamic = "force-dynamic";

export default async function DonatePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ join?: string }>;
}) {
  const { code } = await params;
  const { join } = await searchParams;

  const [rider, user, charity] = await Promise.all([
    prisma.riderProfile.findUnique({ where: { charityCode: code }, include: { user: true } }),
    getCurrentUser(),
    prisma.charity.findFirst({ where: { isActive: true } }),
  ]);

  if (!rider) notFound();

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-marigold-pale">
          <HeartHandshake className="h-7 w-7 text-marigold-deep" />
        </span>
        <p className="mt-4 text-sm text-text-soft">You travelled with</p>
        <p className="font-display text-2xl text-ink">{rider.user.name}</p>
      </div>

      <div className="mt-8 rounded-3xl border border-paper-line bg-white p-6 sm:p-8">
        <p className="text-center text-sm leading-relaxed text-text">
          Your ride was offered freely. If you would like to support our charity, you can
          contribute any amount you wish.
        </p>

        {charity && (
          <p className="mt-3 rounded-xl bg-paper-dim/60 px-3 py-2 text-center text-xs text-text-soft">
            100% of this donation goes to <strong>{charity.name}</strong>, never to the rider.
          </p>
        )}

        <div className="mt-6">
          {rider.isVehicleVerified ? (
            <DonateForm charityCode={rider.charityCode} rideJoinId={join} loggedIn={Boolean(user)} />
          ) : (
            <div className="rounded-2xl border border-dashed border-paper-line px-5 py-8 text-center">
              <Clock className="mx-auto h-6 w-6 text-marigold-deep" />
              <p className="mt-3 text-sm text-text-soft">
                This charity QR isn&apos;t active yet — the rider&apos;s verification is still in
                progress.
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-text-soft">
        Donating is entirely optional and never required to travel with Backseat.
      </p>
    </div>
  );
}
