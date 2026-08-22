import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

const schema = z.object({ status: z.enum(["REFUNDED"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const donation = await prisma.donation.findUnique({ where: { id } });
    if (!donation) return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    if (donation.status !== "SUCCESS") {
      return NextResponse.json({ error: "Only successful donations can be refunded" }, { status: 409 });
    }

    await prisma.donation.update({ where: { id }, data: { status: "REFUNDED" } });
    await prisma.auditLog.create({
      data: { actorId: admin.id, action: "DONATION_REFUNDED", targetType: "Donation", targetId: id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
