import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateDonationRef } from "@/lib/ids";
import { buildUpiLink } from "@/lib/upi";

// Amount is entirely the passenger's choice. The only server-side constraints are
// "must be a positive number" and a fraud-guard ceiling — never a minimum, never a
// suggested/default value, and never anything the rider can influence.
const schema = z.object({
  charityCode: z.string().min(1),
  amount: z.number().positive().max(100000, "For amounts above ₹1,00,000 please contact us directly"),
  rideJoinId: z.string().optional(),
  donorName: z.string().trim().max(80).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const rider = await prisma.riderProfile.findUnique({
    where: { charityCode: parsed.data.charityCode },
    include: { user: true },
  });
  if (!rider) return NextResponse.json({ error: "Charity QR not recognised" }, { status: 404 });
  if (!rider.isVehicleVerified) {
    return NextResponse.json(
      { error: "This rider's charity QR is not active yet — verification is pending." },
      { status: 403 },
    );
  }

  const charity = await prisma.charity.findFirst({ where: { isActive: true } });
  if (!charity) return NextResponse.json({ error: "No active charity is configured" }, { status: 500 });
  const campaign = await prisma.campaign.findFirst({
    where: { charityId: charity.id, isActive: true },
    orderBy: { startedAt: "desc" },
  });

  let rideJoinId: string | undefined;
  if (parsed.data.rideJoinId) {
    const join = await prisma.rideJoin.findUnique({
      where: { id: parsed.data.rideJoinId },
      include: { rideOffer: true },
    });
    if (join && join.rideOffer.riderId === rider.id) rideJoinId = join.id;
  }

  const user = await getCurrentUser();
  const donationRef = generateDonationRef();

  const donation = await prisma.donation.create({
    data: {
      donationRef,
      amount: parsed.data.amount,
      riderId: rider.id,
      passengerId: user?.id,
      rideJoinId,
      charityId: charity.id,
      campaignId: campaign?.id,
      status: "PENDING",
      paymentMethod: "UPI",
      donorDisplayNameSnapshot: user?.name ?? parsed.data.donorName ?? "A kind traveller",
    },
  });

  const upiLink = buildUpiLink({
    payeeVpa: charity.beneficiaryUpiVpa,
    payeeName: charity.beneficiaryName,
    amount: parsed.data.amount,
    note: `Donation to ${charity.name} via Backseat`,
    transactionRef: donationRef,
  });

  return NextResponse.json({ donationId: donation.id, donationRef, upiLink });
}
