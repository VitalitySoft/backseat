import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

const schema = z.object({ status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    await prisma.rideOffer.update({ where: { id }, data: { status: parsed.data.status } });
    await prisma.auditLog.create({
      data: { actorId: admin.id, action: "RIDE_STATUS_FORCED", targetType: "RideOffer", targetId: id, metadata: parsed.data.status },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
