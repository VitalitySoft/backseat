import { notFound } from "next/navigation";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ReceiptActions } from "./receipt-actions";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const donation = await prisma.donation.findUnique({
    where: { id },
    include: { charity: true, campaign: true, rider: { include: { user: true } } },
  });

  if (!donation || donation.status !== "SUCCESS") notFound();

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-banyan-pale">
          <HeartHandshake className="h-8 w-8 text-banyan-deep" />
        </span>
        <h1 className="mt-4 font-display text-2xl text-ink">Thank you for supporting a good cause.</h1>
      </div>

      <div className="ticket-perforation relative mt-8 overflow-hidden rounded-3xl border border-paper-line bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-text-soft">Donation amount</p>
          <p className="mt-1 font-display text-4xl text-ink">₹{donation.amount.toLocaleString("en-IN")}</p>
        </div>

        <dl className="mt-8 space-y-3 border-t border-dashed border-paper-line pt-6 text-sm">
          <Row label="Receipt ID" value={donation.donationRef} mono />
          <Row label="Transaction ID" value={donation.transactionRef ?? "—"} mono />
          <Row
            label="Date & time"
            value={new Date(donation.completedAt ?? donation.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
          <Row label="Charity" value={donation.charity.name} />
          {donation.campaign && <Row label="Campaign" value={donation.campaign.name} />}
          {donation.rider && <Row label="Ride with" value={donation.rider.user.name} />}
          <Row label="Payment method" value="UPI" />
          <Row label="Status" value="Successful" valueClass="text-banyan-deep font-semibold" />
        </dl>

        <p className="mt-6 rounded-xl bg-paper-dim/60 px-4 py-3 text-center text-xs text-text-soft">
          This receipt confirms a voluntary charitable donation, not a payment for
          transportation. No fare was charged for this ride.
        </p>
      </div>

      <div className="mt-6">
        <ReceiptActions />
      </div>

      <p className="mt-8 text-center text-sm text-text-soft">
        <Link href="/charity-impact" className="font-semibold text-marigold-deep hover:underline">
          See where your donation goes →
        </Link>
      </p>
    </div>
  );
}

function Row({ label, value, mono, valueClass }: { label: string; value: string; mono?: boolean; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-text-soft">{label}</dt>
      <dd className={`text-right text-ink ${mono ? "font-mono text-xs" : ""} ${valueClass ?? ""}`}>{value}</dd>
    </div>
  );
}
