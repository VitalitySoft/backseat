"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bike,
  Route,
  HandHeart,
  Building2,
  ShieldCheck,
  Flag,
  AlertTriangle,
  Trophy,
  ScrollText,
  FileText,
} from "lucide-react";

const SECTIONS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/riders", label: "Riders & Vehicles", icon: Bike },
  { href: "/admin/rides", label: "Ride Offers", icon: Route },
  { href: "/admin/donations", label: "Donations", icon: HandHeart },
  { href: "/admin/charities", label: "Charities & Campaigns", icon: Building2 },
  { href: "/admin/verification", label: "Verification", icon: ShieldCheck },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/fraud", label: "Fraud & Suspicious", icon: AlertTriangle },
  { href: "/admin/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/admin/chatbot-documents", label: "Chatbot Docs", icon: FileText },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto border-b border-paper-line bg-white px-4 py-2 md:w-60 md:shrink-0 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-3 md:py-6">
      {SECTIONS.map((s) => {
        const active = pathname === s.href;
        return (
          <Link
            key={s.href}
            href={s.href}
            className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-ink text-on-ink" : "text-text-soft hover:bg-paper-dim hover:text-ink"
            }`}
          >
            <s.icon className="h-4 w-4 shrink-0" />
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
