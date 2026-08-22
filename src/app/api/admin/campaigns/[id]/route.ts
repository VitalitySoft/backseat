import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

const schema = z.object({
  isActive: z.boolean().optional(),
  goalAmount: z.number().positive().optional(),
  amountDistributed: z.number().nonnegative().optional(),
  beneficiariesSupported: z.number().int().nonnegative().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    await prisma.campaign.update({ where: { id }, data: parsed.data });
    await prisma.auditLog.create({
      data: { actorId: admin.id, action: "CAMPAIGN_UPDATED", targetType: "Campaign", targetId: id, metadata: JSON.stringify(parsed.data) },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
