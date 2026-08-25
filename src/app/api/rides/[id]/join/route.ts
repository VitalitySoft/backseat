import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();

    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "Admin accounts cannot join rides" }, { status: 403 });
    }

    const offer = await prisma.rideOffer.findUnique({ where: { id }, include: { rider: true } });
    if (!offer || offer.status !== "ACTIVE") {
      return NextResponse.json({ error: "This ride is no longer available" }, { status: 404 });
    }
    if (offer.rider.userId === user.id) {
      return NextResponse.json({ error: "You cannot join your own ride offer" }, { status: 400 });
    }

    const existing = await prisma.rideJoin.findFirst({
      where: { rideOfferId: id, passengerId: user.id, status: { in: ["REQUESTED", "ACCEPTED"] } },
    });
    if (existing) {
      return NextResponse.json({ error: "You've already requested to join this ride" }, { status: 409 });
    }

    const join = await prisma.rideJoin.create({
      data: { rideOfferId: id, passengerId: user.id, status: "REQUESTED" },
    });

    await prisma.notification.create({
      data: {
        userId: offer.rider.userId,
        type: "RIDE_REQUEST",
        title: "New ride request",
        body: `${user.name} would like to join your ride from ${offer.startLocation} to ${offer.destination}.`,
      },
    });

    return NextResponse.json({ id: join.id });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
