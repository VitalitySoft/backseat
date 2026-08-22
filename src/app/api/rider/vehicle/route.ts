import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRider, AuthError } from "@/lib/auth";

const schema = z.object({
  seatsAvailable: z.number().int().min(1).max(6).optional(),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
});

export async function PATCH(req: Request) {
  try {
    const user = await requireRider();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    await prisma.riderProfile.update({
      where: { id: user.riderProfile!.id },
      data: {
        ...(parsed.data.seatsAvailable ? { seatsAvailable: parsed.data.seatsAvailable } : {}),
        ...(parsed.data.bio !== undefined ? { bio: parsed.data.bio || null } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
