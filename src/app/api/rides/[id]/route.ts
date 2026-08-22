import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = await prisma.rideOffer.findUnique({
    where: { id },
    include: { rider: { include: { user: true } } },
  });
  if (!offer) return NextResponse.json({ error: "Ride not found" }, { status: 404 });

  return NextResponse.json({
    offer: {
      id: offer.id,
      startLocation: offer.startLocation,
      destination: offer.destination,
      seatsAvailable: offer.seatsAvailable,
      vehicleType: offer.vehicleType,
      notes: offer.notes,
      status: offer.status,
      createdAt: offer.createdAt,
      rider: {
        id: offer.rider.id,
        name: offer.rider.user.name,
        vehicleMake: offer.rider.vehicleMake,
        vehicleModel: offer.rider.vehicleModel,
        vehiclePlate: offer.rider.vehiclePlate,
        isVehicleVerified: offer.rider.isVehicleVerified,
        memberSince: offer.rider.memberSince,
      },
    },
  });
}

const patchSchema = z.object({ status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const offer = await prisma.rideOffer.findUnique({ where: { id } });
    if (!offer) return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    if (offer.riderId !== user.riderProfile?.id) {
      return NextResponse.json({ error: "You can only update your own ride offers" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    await prisma.rideOffer.update({ where: { id }, data: { status: parsed.data.status } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
