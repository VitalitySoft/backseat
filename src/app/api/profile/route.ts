import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { LEADERBOARD_DISPLAY } from "@/lib/constants";

const schema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/)
    .optional()
    .or(z.literal("")),
  leaderboardDisplay: z.enum(LEADERBOARD_DISPLAY).optional(),
});

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone || null } : {}),
        ...(parsed.data.leaderboardDisplay ? { leaderboardDisplay: parsed.data.leaderboardDisplay } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
