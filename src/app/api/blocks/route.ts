import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const schema = z.object({ blockedId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    if (parsed.data.blockedId === user.id) {
      return NextResponse.json({ error: "You can't block yourself" }, { status: 400 });
    }

    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: parsed.data.blockedId } },
      create: { blockerId: user.id, blockedId: parsed.data.blockedId },
      update: {},
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
