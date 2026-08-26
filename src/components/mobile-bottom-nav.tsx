"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bike, Car, ClipboardList, User, LogIn, ShieldCheck } from "lucide-react";
import type { NavUser } from "@/components/nav-types";

export function MobileBottomNav({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const isAdmin = user?.role === "ADMIN";

  const items = isAdmin
    ? [
        { href: "/", label: "Home", icon: Home },
        { href: "/admin", label: "Admin", icon: ShieldCheck, emphasize: true },
      ]
    : user
      ? [
          { href: "/find-a-ride", label: "Find", icon: Search },
          { href: "/dashboard/my-trips", label: "My Trips", icon: ClipboardList },
          { href: "/offer-a-ride", label: "Offer", icon: Bike, emphasize: true },
          { href: "/dashboard/my-rides", label: "My Rides", icon: Car },
          { href: "/dashboard/profile", label: "Profile", icon: User },
        ]
      : [
          { href: "/", label: "Home", icon: Home },
          { href: "/find-a-ride", label: "Find", icon: Search },
          { href: "/offer-a-ride", label: "Offer", icon: Bike },
          { href: "/login", label: "Login", icon: LogIn },
        ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-paper-line bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 py-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          if ("emphasize" in item && item.emphasize) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="-mt-5 flex flex-col items-center gap-1"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-marigold text-ink shadow-lg shadow-marigold/40">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-[11px] font-semibold text-marigold-deep">{item.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium ${
                active ? "text-ink" : "text-text-soft"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-marigold-deep" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
