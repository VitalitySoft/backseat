import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
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

  const { name, email } = parsed.data;
  const phone = parsed.data.phone || undefined;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email or phone already exists" },
      { status: 409 },
    );
  }

  // Riders/passengers log in with an emailed OTP, never a password — this hash
  // is an unguessable placeholder to satisfy the schema, never used to authenticate.
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: await hashPassword(randomBytes(32).toString("hex")),
    },
  });

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
