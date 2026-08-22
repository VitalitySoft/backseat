import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRider, AuthError } from "@/lib/auth";

const schema = z.object({ active: z.boolean() });

export async function PATCH(req: Request) {
  try {
    const user = await requireRider();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    if (parsed.data.active && !user.riderProfile!.isVehicleVerified) {
      return NextResponse.json(
        { error: "Your vehicle must be verified before you can start sharing rides." },
        { status: 403 },
      );
    }

    await prisma.riderProfile.update({
      where: { id: user.riderProfile!.id },
      data: { isSharingActive: parsed.data.active },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
