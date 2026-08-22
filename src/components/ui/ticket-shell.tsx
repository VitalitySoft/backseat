import type { ReactNode } from "react";
import clsx from "clsx";

/**
 * The recurring "boarding pass" motif: a main stub plus a perforated side stub,
 * with hole-punch dots cut into the divider — used for ride cards, the charity QR
 * card, and donation receipts so the whole flow reads as one connected journey.
 */
export function TicketShell({
  left,
  right,
  className,
}: {
  left: ReactNode;
  right: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "relative flex flex-col overflow-hidden rounded-3xl border border-paper-line bg-white shadow-sm shadow-ink/5 sm:flex-row",
        className,
      )}
    >
      <div className="flex-1 p-5 sm:p-6">{left}</div>

      <div className="relative border-t border-dashed border-paper-line bg-paper-dim/70 p-5 sm:w-64 sm:border-l sm:border-t-0 sm:p-6">
        <span className="absolute -left-[9px] top-0 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-paper sm:hidden" />
        <span className="absolute -right-[9px] top-0 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-paper sm:hidden" />
        <span className="absolute left-0 -top-[9px] hidden h-[18px] w-[18px] -translate-x-1/2 rounded-full bg-paper sm:block" />
        <span className="absolute -bottom-[9px] left-0 hidden h-[18px] w-[18px] -translate-x-1/2 rounded-full bg-paper sm:block" />
        {right}
      </div>
    </div>
  );
}
