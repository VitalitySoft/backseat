import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Creates a fresh OTP for the email, invalidating any earlier unconsumed codes. */
export async function issueOtp(email: string): Promise<string> {
  await prisma.otpCode.updateMany({
    where: { email, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.otpCode.create({
    data: { email, codeHash, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });

  // No SMTP provider is configured yet — log so it can be read from the server
  // console in local dev instead of silently vanishing.
  console.log(`[OTP] ${email} -> ${code} (expires in 5 min)`);

  return code;
}

export type OtpVerifyResult = "OK" | "EXPIRED" | "INVALID" | "TOO_MANY_ATTEMPTS" | "NOT_FOUND";

export async function verifyOtp(email: string, code: string): Promise<OtpVerifyResult> {
  const record = await prisma.otpCode.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return "NOT_FOUND";
  if (record.attempts >= MAX_ATTEMPTS) return "TOO_MANY_ATTEMPTS";
  if (record.expiresAt.getTime() < Date.now()) return "EXPIRED";

  const valid = await bcrypt.compare(code, record.codeHash);
  if (!valid) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return "INVALID";
  }

  await prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  return "OK";
}
