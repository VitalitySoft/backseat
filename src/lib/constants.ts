export const VEHICLE_TYPES = ["TWO_WHEELER", "FOUR_WHEELER"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  TWO_WHEELER: "Two Wheeler",
  FOUR_WHEELER: "Four Wheeler",
};

export const RIDE_OFFER_STATUS = ["ACTIVE", "COMPLETED", "CANCELLED"] as const;
export type RideOfferStatus = (typeof RIDE_OFFER_STATUS)[number];

export const RIDE_JOIN_STATUS = [
  "REQUESTED",
  "ACCEPTED",
  "DECLINED",
  "COMPLETED",
  "CANCELLED",
] as const;
export type RideJoinStatus = (typeof RIDE_JOIN_STATUS)[number];

export const DONATION_STATUS = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"] as const;
export type DonationStatus = (typeof DONATION_STATUS)[number];

export const LEADERBOARD_DISPLAY = [
  "FULL_NAME",
  "FIRST_NAME_INITIAL",
  "ANONYMOUS",
] as const;
export type LeaderboardDisplay = (typeof LEADERBOARD_DISPLAY)[number];

export const USER_ROLES = ["USER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const REPORT_STATUS = ["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"] as const;

export const SITE_NAME = "Backseat";
export const SITE_TAGLINE = "Share Your Journey. Spread Kindness.";

/** Suggested chips shown as tap-to-fill helpers only — never a minimum, default, or required amount. */
export const DONATION_QUICK_AMOUNTS = [50, 100, 250, 500] as const;
