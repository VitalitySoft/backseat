import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const context = typeof body?.context === "string" ? body.context.slice(0, 200) : undefined;

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "SOS_TRIGGERED",
        targetType: "User",
        targetId: user.id,
        metadata: context,
      },
    });

    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: "SOS_ALERT",
        title: "SOS alert triggered",
        body: `${user.name} triggered an SOS alert.${context ? ` Context: ${context}` : ""}`,
      })),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
