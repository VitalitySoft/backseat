import "server-only";
import { prisma } from "@/lib/prisma";

export interface FraudSignal {
  id: string;
  type: "HIGH_VALUE" | "RAPID_REPEAT";
  description: string;
  donationRef: string;
  amount: number;
  createdAt: Date;
}

const HIGH_VALUE_THRESHOLD = 20000;
const RAPID_REPEAT_WINDOW_MS = 60 * 60 * 1000;
const RAPID_REPEAT_COUNT = 3;

export async function getFraudSignals(): Promise<FraudSignal[]> {
  const donations = await prisma.donation.findMany({
    where: { status: { in: ["SUCCESS", "PENDING"] } },
    include: { passenger: true, rider: { include: { user: true } } },
    orderBy: { createdAt: "asc" },
  });

  const signals: FraudSignal[] = [];

  for (const d of donations) {
    if (d.amount >= HIGH_VALUE_THRESHOLD) {
      signals.push({
        id: `${d.id}-high`,
        type: "HIGH_VALUE",
        description: `₹${d.amount.toLocaleString("en-IN")} from ${d.passenger?.name ?? "an anonymous donor"} to ${d.rider?.user.name ?? "unknown rider"} — above the ₹${HIGH_VALUE_THRESHOLD.toLocaleString("en-IN")} review threshold`,
        donationRef: d.donationRef,
        amount: d.amount,
        createdAt: d.createdAt,
      });
    }
  }

  const byPair = new Map<string, typeof donations>();
  for (const d of donations) {
    if (!d.passengerId || !d.riderId) continue;
    const key = `${d.passengerId}:${d.riderId}`;
    if (!byPair.has(key)) byPair.set(key, []);
    byPair.get(key)!.push(d);
  }

  for (const [, group] of byPair) {
    for (let i = 0; i + RAPID_REPEAT_COUNT - 1 < group.length; i++) {
      const windowStart = group[i].createdAt.getTime();
      const windowEnd = group[i + RAPID_REPEAT_COUNT - 1].createdAt.getTime();
      if (windowEnd - windowStart <= RAPID_REPEAT_WINDOW_MS) {
        const d = group[i + RAPID_REPEAT_COUNT - 1];
        signals.push({
          id: `${d.id}-rapid`,
          type: "RAPID_REPEAT",
          description: `${d.passenger?.name ?? "A donor"} sent ${RAPID_REPEAT_COUNT}+ donations to ${d.rider?.user.name ?? "the same rider"} within an hour`,
          donationRef: d.donationRef,
          amount: d.amount,
          createdAt: d.createdAt,
        });
        break;
      }
    }
  }

  return signals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
