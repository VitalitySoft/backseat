import Link from "next/link";
import { Logo } from "@/components/logo";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/find-a-ride", label: "Find a Ride" },
      { href: "/offer-a-ride", label: "Offer a Ride" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/top-contributors", label: "Top Contributors" },
    ],
  },
  {
    title: "Charity",
    links: [
      { href: "/charity-impact", label: "Where Your Donation Goes" },
      { href: "/about", label: "About Us" },
    ],
  },
  {
    title: "Trust & Safety",
    links: [
      { href: "/safety", label: "Safety Centre" },
      { href: "/community-guidelines", label: "Community Guidelines" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Use" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/disclaimers", label: "Legal & Compliance" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="hidden border-t border-paper-line bg-ink text-on-ink-soft md:block">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Logo className="text-on-ink" markClassName="text-marigold" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-on-ink-soft">
              Every ride offered here is free. Every donation is a choice. Backseat never
              sets a fare — riders share a seat, and passengers may support our charity partners
              with any amount they wish.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-on-ink-soft/70">
                {col.title}
              </p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm hover:text-marigold-pale">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-on-ink-soft/70 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Backseat. Not a transportation or fare-collection service.</p>
          <p>Donations are collected on behalf of registered charity partners and are not tax receipts unless stated.</p>
        </div>
      </div>
    </footer>
  );
}
