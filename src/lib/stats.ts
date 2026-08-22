import "server-only";
import { prisma } from "@/lib/prisma";
import type { LeaderboardDisplay } from "@/lib/constants";

export function displayNameFor(fullName: string, pref: string): string {
  if (pref === "ANONYMOUS") return "A kind traveller";
  if (pref === "FIRST_NAME_INITIAL") {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0] ?? "Someone";
    const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1].charAt(0).toUpperCase()}.` : "";
    return `${first}${lastInitial}`;
  }
  return fullName;
}

export async function getPlatformStats() {
  const [donationAgg, rideCount, distinctHelped, activeRiders, monthDonors] = await Promise.all([
    prisma.donation.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.rideJoin.count({ where: { status: { in: ["COMPLETED", "ACCEPTED"] } } }),
    prisma.rideJoin.findMany({
      where: { status: { in: ["COMPLETED", "ACCEPTED"] } },
      distinct: ["passengerId"],
      select: { passengerId: true },
    }),
    prisma.riderProfile.count({ where: { isSharingActive: true, isVehicleVerified: true } }),
    prisma.donation.findMany({
      where: { status: "SUCCESS", createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      distinct: ["passengerId"],
      select: { passengerId: true },
    }),
  ]);

  return {
    totalDonated: donationAgg._sum.amount ?? 0,
    totalDonations: donationAgg._count,
    totalRides: rideCount,
    peopleHelped: distinctHelped.length,
    activeRiders,
    monthlyContributors: monthDonors.length,
  };
}

export interface LeaderboardEntry {
  riderId: string;
  displayName: string;
  totalDonated: number;
  donationCount: number;
  vehicleType: string;
  avatarInitial: string;
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const grouped = await prisma.donation.groupBy({
    by: ["riderId"],
    where: { status: "SUCCESS", riderId: { not: null } },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: "desc" } },
    take: limit * 2 + 10,
  });

  const riderIds = grouped.map((g) => g.riderId!).filter(Boolean);
  const riders = await prisma.riderProfile.findMany({
    where: { id: { in: riderIds }, hiddenFromLeaderboard: false },
    include: { user: true },
  });
  const riderMap = new Map(riders.map((r) => [r.id, r]));

  return grouped
    .map((g) => {
      const rider = riderMap.get(g.riderId!);
      if (!rider) return null;
      const displayName = displayNameFor(rider.user.name, rider.user.leaderboardDisplay);
      return {
        riderId: rider.id,
        displayName,
        totalDonated: g._sum.amount ?? 0,
        donationCount: g._count,
        vehicleType: rider.vehicleType,
        avatarInitial: displayName.charAt(0).toUpperCase(),
      };
    })
    .filter((x): x is LeaderboardEntry => x !== null)
    .slice(0, limit);
}

export async function getRiderRank(riderId: string): Promise<number | null> {
  const grouped = await prisma.donation.groupBy({
    by: ["riderId"],
    where: { status: "SUCCESS", riderId: { not: null } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });
  const index = grouped.findIndex((g) => g.riderId === riderId);
  return index === -1 ? null : index + 1;
}

export interface RiderDashboardStats {
  ridesOffered: number;
  peopleHelped: number;
  totalDonated: number;
  donationCount: number;
  rank: number | null;
  totalRiders: number;
  currentRide: { id: string; startLocation: string; destination: string; requestCount: number } | null;
  donations: { date: string; amount: number }[];
}

export async function getRiderDashboardStats(riderId: string): Promise<RiderDashboardStats> {
  const [ridesOffered, helpedJoins, donationAgg, rank, totalRiders, currentRide, donations] = await Promise.all([
    prisma.rideOffer.count({ where: { riderId } }),
    prisma.rideJoin.findMany({
      where: { rideOffer: { riderId }, status: { in: ["COMPLETED", "ACCEPTED"] } },
      distinct: ["passengerId"],
      select: { passengerId: true },
    }),
    prisma.donation.aggregate({
      where: { riderId, status: "SUCCESS" },
      _sum: { amount: true },
      _count: true,
    }),
    getRiderRank(riderId),
    prisma.riderProfile.count(),
    prisma.rideOffer.findMany({
      where: { riderId, status: "ACTIVE" },
      include: { joins: true },
      orderBy: { createdAt: "desc" },
      take: 1,
    }),
    prisma.donation.findMany({
      where: { riderId, status: "SUCCESS" },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    ridesOffered,
    peopleHelped: helpedJoins.length,
    totalDonated: donationAgg._sum.amount ?? 0,
    donationCount: donationAgg._count,
    rank,
    totalRiders,
    currentRide: currentRide[0]
      ? {
          id: currentRide[0].id,
          startLocation: currentRide[0].startLocation,
          destination: currentRide[0].destination,
          requestCount: currentRide[0].joins.length,
        }
      : null,
    donations: donations.map((d) => ({ date: d.createdAt.toISOString(), amount: d.amount })),
  };
}

export async function getAdminOverview() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    activeRiders,
    totalRides,
    donationAgg,
    peopleHelped,
    todayAgg,
    monthAgg,
    openReports,
    pendingVerification,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.riderProfile.count({ where: { isSharingActive: true, isVehicleVerified: true } }),
    prisma.rideOffer.count(),
    prisma.donation.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true }, _count: true }),
    prisma.rideJoin.findMany({
      where: { status: { in: ["COMPLETED", "ACCEPTED"] } },
      distinct: ["passengerId"],
      select: { passengerId: true },
    }),
    prisma.donation.aggregate({
      where: { status: "SUCCESS", createdAt: { gte: startOfToday } },
      _sum: { amount: true },
    }),
    prisma.donation.aggregate({
      where: { status: "SUCCESS", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.riderProfile.count({ where: { isVehicleVerified: false } }),
  ]);

  return {
    totalUsers,
    activeRiders,
    totalRides,
    totalDonated: donationAgg._sum.amount ?? 0,
    totalDonationCount: donationAgg._count,
    peopleHelped: peopleHelped.length,
    todayDonated: todayAgg._sum.amount ?? 0,
    monthDonated: monthAgg._sum.amount ?? 0,
    openReports,
    pendingVerification,
  };
}

export async function getLifetimeContributorCount() {
  const donors = await prisma.donation.findMany({
    where: { status: "SUCCESS" },
    distinct: ["passengerId"],
    select: { passengerId: true },
  });
  return donors.length;
}
