import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueOtp } from "@/lib/otp";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "No account found with this email. Please register first." },
      { status: 404 },
    );
  }
  if (user.isBlocked) {
    return NextResponse.json(
      { error: "This account has been suspended. Contact support for help." },
      { status: 403 },
    );
  }

  if (user.role === "ADMIN") {
    return NextResponse.json({ method: "password" });
  }

  const code = await issueOtp(email);
  const devOtp = process.env.NODE_ENV !== "production" ? code : undefined;
  return NextResponse.json({ method: "otp", devOtp });
}
