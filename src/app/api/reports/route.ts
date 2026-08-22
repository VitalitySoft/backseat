import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const schema = z.object({
  reportedId: z.string().min(1),
  reason: z.string().trim().min(3).max(80),
  details: z.string().trim().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    if (parsed.data.reportedId === user.id) {
      return NextResponse.json({ error: "You can't report yourself" }, { status: 400 });
    }

    const reported = await prisma.user.findUnique({ where: { id: parsed.data.reportedId } });
    if (!reported) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedId: parsed.data.reportedId,
        reason: parsed.data.reason,
        details: parsed.data.details,
      },
    });

    return NextResponse.json({ id: report.id });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
