import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRider, AuthError } from "@/lib/auth";
import { generateCharityCode } from "@/lib/ids";

export async function POST() {
  try {
    const user = await requireRider();
    const charityCode = generateCharityCode();
    await prisma.riderProfile.update({ where: { id: user.riderProfile!.id }, data: { charityCode } });
    await prisma.auditLog.create({
      data: { actorId: user.id, action: "QR_REGENERATED", targetType: "RiderProfile", targetId: user.riderProfile!.id },
    });
    return NextResponse.json({ charityCode });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
