import { randomBytes } from "crypto";

function randomBase36(length: number): string {
  return randomBytes(length)
    .toString("hex")
    .split("")
    .map((c) => parseInt(c, 16).toString(36))
    .join("")
    .slice(0, length)
    .toUpperCase();
}

/** Human-readable donation reference shown on receipts, e.g. DON-7F2K9Q. */
export function generateDonationRef(): string {
  return `DON-${randomBase36(6)}`;
}

/** Simulated payment gateway transaction reference, unique per successful charge. */
export function generateTransactionRef(): string {
  return `TXN${Date.now().toString(36).toUpperCase()}${randomBase36(5)}`;
}

/** Rider attribution code embedded in the charity QR — never a payment account, purely for crediting the right rider. */
export function generateCharityCode(): string {
  return `BS-${randomBase36(8)}`;
}
