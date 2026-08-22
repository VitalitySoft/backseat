import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { generateCharityCode } from "@/lib/ids";
import { VEHICLE_TYPES } from "@/lib/constants";

const schema = z.object({
  vehicleType: z.enum(VEHICLE_TYPES),
  vehicleMake: z.string().trim().min(1).max(60),
  vehicleModel: z.string().trim().min(1).max(60),
  vehiclePlate: z.string().trim().min(3).max(20),
  seatsAvailable: z.number().int().min(1).max(6),
  bio: z.string().trim().max(280).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const existing = await prisma.riderProfile.findUnique({ where: { userId: user.id } });
    if (existing) {
      return NextResponse.json({ error: "You already have a rider profile" }, { status: 409 });
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    // Note: this schema has no fare/amount/price field by design — riders can never set one.
    const rider = await prisma.riderProfile.create({
      data: {
        userId: user.id,
        ...parsed.data,
        charityCode: generateCharityCode(),
        isVehicleVerified: false,
        isSharingActive: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "RIDER_PROFILE_CREATED",
        targetType: "RiderProfile",
        targetId: rider.id,
      },
    });

    return NextResponse.json({ id: rider.id });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
