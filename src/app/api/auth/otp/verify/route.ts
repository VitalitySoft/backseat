import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { getSession } from "@/lib/session";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  code: z.string().trim().regex(/^[0-9]{6}$/, "Enter the 6-digit code"),
});

const ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: "No pending code for this email. Request a new one.",
  EXPIRED: "This code has expired. Request a new one.",
  INVALID: "Incorrect code. Please try again.",
  TOO_MANY_ATTEMPTS: "Too many incorrect attempts. Request a new code.",
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { email, code } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "No account found with this email." }, { status: 404 });
  }
  if (user.isBlocked) {
    return NextResponse.json(
      { error: "This account has been suspended. Contact support for help." },
      { status: 403 },
    );
  }

  const result = await verifyOtp(email, code);
  if (result !== "OK") {
    return NextResponse.json({ error: ERROR_MESSAGES[result] }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
}
