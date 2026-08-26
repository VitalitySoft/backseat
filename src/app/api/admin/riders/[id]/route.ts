import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

const schema = z.object({
  isVehicleVerified: z.boolean().optional(),
  hiddenFromLeaderboard: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const rider = await prisma.riderProfile.update({ where: { id }, data: parsed.data });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "RIDER_UPDATED",
        targetType: "RiderProfile",
        targetId: id,
        metadata: JSON.stringify(parsed.data),
      },
    });

    if (parsed.data.isVehicleVerified) {
      await prisma.notification.create({
        data: {
          userId: rider.userId,
          type: "VEHICLE_VERIFIED",
          title: "Your vehicle is verified",
          body: "Your charity QR is now active — you can offer rides and receive donations.",
          link: "/offer-a-ride",
        },
      });
    }

    return NextResponse.json({ id: rider.id });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
