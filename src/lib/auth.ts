import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Full user record for the logged-in session, or null if not authenticated / blocked. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { riderProfile: true },
  });

  if (!user || user.isBlocked) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Not authenticated");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new AuthError("Admin access required");
  return user;
}

export async function requireRider() {
  const user = await requireUser();
  if (!user.riderProfile) throw new AuthError("Rider profile required");
  return user;
}

export class AuthError extends Error {}
