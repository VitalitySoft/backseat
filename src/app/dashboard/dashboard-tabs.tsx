"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/offer-a-ride", label: "Offer Ride" },
  { href: "/dashboard/my-rides", label: "My Rides" },
  { href: "/dashboard/qr", label: "Charity QR" },
  { href: "/dashboard/donations", label: "Donations" },
  { href: "/dashboard/impact", label: "Impact" },
  { href: "/dashboard/profile", label: "Profile" },
];

export function DashboardTabs() {
  const pathname = usePathname();
  return (
    <div className="sticky top-[64px] z-30 hidden border-b border-paper-line bg-paper/95 backdrop-blur md:block">
      <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                active ? "border-marigold text-ink" : "border-transparent text-text-soft hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
