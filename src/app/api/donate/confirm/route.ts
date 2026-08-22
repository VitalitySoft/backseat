import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateTransactionRef } from "@/lib/ids";

/**
 * Stands in for a payment gateway's server-to-server webhook. In production this
 * route would verify a signed callback from the UPI/payment provider instead of
 * trusting the client directly. The idempotency guard (only PENDING -> SUCCESS)
 * is what real webhook handlers need too, so it's kept here deliberately.
 */
const schema = z.object({ donationId: z.string().min(1), donationRef: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const donation = await prisma.donation.findUnique({ where: { id: parsed.data.donationId } });
  if (!donation || donation.donationRef !== parsed.data.donationRef) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  }

  if (donation.status === "SUCCESS") {
    // Already confirmed — return the existing result rather than recording it twice.
    return NextResponse.json({ donationId: donation.id, transactionRef: donation.transactionRef });
  }
  if (donation.status !== "PENDING") {
    return NextResponse.json({ error: `Donation is ${donation.status.toLowerCase()} and cannot be confirmed` }, { status: 409 });
  }

  const transactionRef = generateTransactionRef();
  await prisma.donation.update({
    where: { id: donation.id },
    data: { status: "SUCCESS", transactionRef, completedAt: new Date() },
  });

  if (donation.passengerId) {
    await prisma.notification.create({
      data: {
        userId: donation.passengerId,
        type: "DONATION_COMPLETED",
        title: "Thank you for your donation",
        body: `Your donation of ₹${donation.amount.toLocaleString("en-IN")} was received. Receipt: ${donation.donationRef}.`,
      },
    });
  }
  if (donation.riderId) {
    const rider = await prisma.riderProfile.findUnique({ where: { id: donation.riderId } });
    if (rider) {
      await prisma.notification.create({
        data: {
          userId: rider.userId,
          type: "DONATION_COMPLETED",
          title: "A donation came through your QR",
          body: `Someone you gave a ride to donated ₹${donation.amount.toLocaleString("en-IN")} to charity.`,
        },
      });
    }
  }

  return NextResponse.json({ donationId: donation.id, transactionRef });
}
