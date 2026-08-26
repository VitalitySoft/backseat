import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

async function loadJoinForParticipant(joinId: string, rideId: string, userId: string) {
  const join = await prisma.rideJoin.findUnique({
    where: { id: joinId },
    include: { rideOffer: { include: { rider: true } }, passenger: true },
  });
  if (!join || join.rideOfferId !== rideId) return null;
  const isRider = join.rideOffer.rider.userId === userId;
  const isPassenger = join.passengerId === userId;
  if (!isRider && !isPassenger) return null;
  return { join, isRider, isPassenger };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; joinId: string }> }) {
  try {
    const { id, joinId } = await params;
    const user = await requireUser();

    const ctx = await loadJoinForParticipant(joinId, id, user.id);
    if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const messages = await prisma.message.findMany({
      where: { rideJoinId: joinId },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt,
        senderId: m.senderId,
        senderName: m.sender.name,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}

const schema = z.object({ body: z.string().trim().min(1).max(500) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string; joinId: string }> }) {
  try {
    const { id, joinId } = await params;
    const user = await requireUser();

    const ctx = await loadJoinForParticipant(joinId, id, user.id);
    if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!["REQUESTED", "ACCEPTED", "COMPLETED"].includes(ctx.join.status)) {
      return NextResponse.json({ error: "This ride request is no longer active" }, { status: 409 });
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });

    const message = await prisma.message.create({
      data: { rideJoinId: joinId, senderId: user.id, body: parsed.data.body },
    });

    const recipientId = ctx.isRider ? ctx.join.passengerId : ctx.join.rideOffer.rider.userId;
    // The recipient is whichever side the sender ISN'T, so their reply lives on their own page:
    // riders reply from My Rides, passengers reply from My Trips.
    const recipientLink = ctx.isRider ? "/dashboard/my-trips" : "/dashboard/my-rides";
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: "NEW_MESSAGE",
        title: `New message from ${user.name}`,
        body: parsed.data.body.slice(0, 120),
        link: recipientLink,
      },
    });

    return NextResponse.json({ id: message.id });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
