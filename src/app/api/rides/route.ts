import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRider, AuthError } from "@/lib/auth";
import { VEHICLE_TYPES } from "@/lib/constants";

const createSchema = z.object({
  startLocation: z.string().trim().min(2).max(120),
  destination: z.string().trim().min(2).max(120),
  seatsAvailable: z.number().int().min(1).max(6),
  departureAt: z.string().datetime().optional().or(z.literal("")),
  notes: z.string().trim().max(240).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireRider();
    const rider = user.riderProfile!;

    if (!rider.isVehicleVerified) {
      return NextResponse.json(
        { error: "Your vehicle must be verified before you can offer a ride." },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    if (parsed.data.seatsAvailable > rider.seatsAvailable) {
      return NextResponse.json(
        { error: `Your vehicle has at most ${rider.seatsAvailable} spare seat(s).` },
        { status: 400 },
      );
    }
    const departureAt = parsed.data.departureAt ? new Date(parsed.data.departureAt) : undefined;
    if (departureAt && departureAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Departure time must be in the future." }, { status: 400 });
    }

    const offer = await prisma.rideOffer.create({
      data: {
        riderId: rider.id,
        vehicleType: rider.vehicleType,
        seatsAvailable: parsed.data.seatsAvailable,
        startLocation: parsed.data.startLocation,
        destination: parsed.data.destination,
        departureAt,
        notes: parsed.data.notes,
        status: "ACTIVE",
      },
    });

    if (!rider.isSharingActive) {
      await prisma.riderProfile.update({ where: { id: rider.id }, data: { isSharingActive: true } });
    }

    return NextResponse.json({ id: offer.id });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();
  const vehicleType = searchParams.get("vehicleType");

  const offers = await prisma.rideOffer.findMany({
    where: {
      status: "ACTIVE",
      rider: { isSharingActive: true, isVehicleVerified: true },
      OR: [{ departureAt: null }, { departureAt: { gt: new Date() } }],
      ...(from ? { startLocation: { contains: from } } : {}),
      ...(to ? { destination: { contains: to } } : {}),
      ...(vehicleType && VEHICLE_TYPES.includes(vehicleType as never)
        ? { vehicleType }
        : {}),
    },
    include: { rider: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    offers: offers.map((o) => ({
      id: o.id,
      startLocation: o.startLocation,
      destination: o.destination,
      seatsAvailable: o.seatsAvailable,
      vehicleType: o.vehicleType,
      departureAt: o.departureAt,
      notes: o.notes,
      createdAt: o.createdAt,
      rider: {
        id: o.rider.id,
        name: o.rider.user.name,
        vehicleMake: o.rider.vehicleMake,
        vehicleModel: o.rider.vehicleModel,
        isVehicleVerified: o.rider.isVehicleVerified,
      },
    })),
  });
}
