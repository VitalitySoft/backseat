import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).optional(),
  description: z.string().trim().min(2).optional(),
  registrationNumber: z.string().trim().optional(),
  beneficiaryUpiVpa: z.string().trim().min(3).optional(),
  beneficiaryName: z.string().trim().min(2).optional(),
  isActive: z.boolean().optional(),
});

// Editing the beneficiary account is deliberately admin-only — there is no rider-facing
// route anywhere in this codebase that can touch beneficiaryUpiVpa or beneficiaryName.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    await prisma.charity.update({ where: { id }, data: parsed.data });
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "CHARITY_CONFIG_UPDATED",
        targetType: "Charity",
        targetId: id,
        metadata: JSON.stringify(parsed.data),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
