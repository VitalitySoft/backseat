import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const schema = z.object({ status: z.enum(["ACCEPTED", "DECLINED", "COMPLETED", "CANCELLED"]) });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; joinId: string }> },
) {
  try {
    const { id, joinId } = await params;
    const user = await requireUser();

    const join = await prisma.rideJoin.findUnique({
      where: { id: joinId },
      include: { rideOffer: { include: { rider: true } } },
    });
    if (!join || join.rideOfferId !== id) {
      return NextResponse.json({ error: "Ride request not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const isRider = join.rideOffer.rider.userId === user.id;
    const isPassenger = join.passengerId === user.id;

    if (parsed.data.status === "CANCELLED" && !isPassenger) {
      return NextResponse.json({ error: "Only the passenger can cancel their own request" }, { status: 403 });
    }
    if (["ACCEPTED", "DECLINED", "COMPLETED"].includes(parsed.data.status) && !isRider) {
      return NextResponse.json({ error: "Only the rider can update this request" }, { status: 403 });
    }

    await prisma.rideJoin.update({ where: { id: joinId }, data: { status: parsed.data.status } });

    if (parsed.data.status === "ACCEPTED") {
      await prisma.notification.create({
        data: {
          userId: join.passengerId,
          type: "RIDE_ACCEPTED",
          title: "Ride request accepted",
          body: `Your request to join the ride from ${join.rideOffer.startLocation} to ${join.rideOffer.destination} was accepted.`,
        },
      });
    }
    if (parsed.data.status === "DECLINED") {
      await prisma.notification.create({
        data: {
          userId: join.passengerId,
          type: "RIDE_DECLINED",
          title: "Ride request declined",
          body: `Your request to join the ride from ${join.rideOffer.startLocation} to ${join.rideOffer.destination} wasn't accepted this time.`,
        },
      });
    }
    if (parsed.data.status === "COMPLETED") {
      await prisma.notification.create({
        data: {
          userId: join.passengerId,
          type: "RIDE_COMPLETED",
          title: "Ride completed",
          body: "Your ride is marked complete. If you'd like, you can scan the rider's charity QR to support their cause.",
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
