import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

const schema = z.object({ isBlocked: z.boolean().optional(), role: z.enum(["USER", "ADMIN"]).optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const target = await prisma.user.update({ where: { id }, data: parsed.data });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: parsed.data.isBlocked !== undefined ? (parsed.data.isBlocked ? "USER_BLOCKED" : "USER_UNBLOCKED") : "USER_ROLE_CHANGED",
        targetType: "User",
        targetId: id,
        metadata: JSON.stringify(parsed.data),
      },
    });

    return NextResponse.json({ id: target.id });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
