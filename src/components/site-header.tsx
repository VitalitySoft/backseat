"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notification-bell";
import type { NavUser } from "@/components/nav-types";

const PUBLIC_LINKS = [
  { href: "/find-a-ride", label: "Find a Ride" },
  { href: "/offer-a-ride", label: "Offer a Ride" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/charity-impact", label: "Charity Impact" },
  { href: "/top-contributors", label: "Top Contributors" },
  { href: "/about", label: "About Us" },
];

function memberLinks(user: NavUser) {
  return [
    { href: "/find-a-ride", label: "Find a Ride" },
    { href: "/offer-a-ride", label: "Offer a Ride" },
    { href: user.isRider ? "/dashboard/my-rides" : "/dashboard/my-trips", label: user.isRider ? "My Rides" : "My Trips" },
    { href: "/top-contributors", label: "Top Contributors" },
  ];
}

export function SiteHeader({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const navLinks = !user ? PUBLIC_LINKS : isAdmin ? [] : memberLinks(user);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-paper-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href={isAdmin ? "/admin" : "/"} className="text-ink" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-marigold-deep ${
                pathname === link.href ? "text-ink" : "text-text-soft"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {!user && (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-text-soft hover:text-ink"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-on-ink transition-transform hover:scale-[1.03]"
              >
                Get Started
              </Link>
            </>
          )}
          {user && (
            <>
              <NotificationBell />
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                  className="flex items-center gap-2 rounded-full border border-paper-line bg-white/60 py-1.5 pl-1.5 pr-3 text-sm font-semibold text-ink hover:border-marigold"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-on-ink">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {user.name.split(" ")[0]}
                  <ChevronDown className="h-4 w-4 text-text-soft" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-paper-line bg-white shadow-xl shadow-ink/5">
                    {isAdmin ? (
                      <Link href="/admin" className="block px-4 py-2.5 text-sm text-text hover:bg-paper-dim">
                        Admin Portal
                      </Link>
                    ) : (
                      <>
                        <Link href="/dashboard" className="block px-4 py-2.5 text-sm text-text hover:bg-paper-dim">
                          Dashboard
                        </Link>
                        {user.isRider ? (
                          <Link href="/dashboard/qr" className="block px-4 py-2.5 text-sm text-text hover:bg-paper-dim">
                            Charity QR
                          </Link>
                        ) : (
                          <Link href="/become-a-rider" className="block px-4 py-2.5 text-sm text-text hover:bg-paper-dim">
                            Become a Rider
                          </Link>
                        )}
                        <Link href="/dashboard/donations" className="block px-4 py-2.5 text-sm text-text hover:bg-paper-dim">
                          Donations
                        </Link>
                        <Link href="/dashboard/impact" className="block px-4 py-2.5 text-sm text-text hover:bg-paper-dim">
                          Impact
                        </Link>
                        <Link href="/dashboard/profile" className="block px-4 py-2.5 text-sm text-text hover:bg-paper-dim">
                          Profile
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full border-t border-paper-line px-4 py-2.5 text-left text-sm text-rose-deep hover:bg-rose-pale"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          {user && <NotificationBell />}
          <button
            className="rounded-full p-2 text-ink"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-paper-line bg-paper px-4 pb-4 lg:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-text hover:bg-paper-dim"
              >
                {link.label}
              </Link>
            ))}
            {user && !isAdmin && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-text hover:bg-paper-dim"
                >
                  Dashboard
                </Link>
                {user.isRider ? (
                  <Link
                    href="/dashboard/qr"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-text hover:bg-paper-dim"
                  >
                    Charity QR
                  </Link>
                ) : (
                  <Link
                    href="/become-a-rider"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-text hover:bg-paper-dim"
                  >
                    Become a Rider
                  </Link>
                )}
                <Link
                  href="/dashboard/donations"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-text hover:bg-paper-dim"
                >
                  Donations
                </Link>
                <Link
                  href="/dashboard/impact"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-text hover:bg-paper-dim"
                >
                  Impact
                </Link>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-text hover:bg-paper-dim"
                >
                  Profile
                </Link>
              </>
            )}
            <div className="mt-2 flex flex-col gap-2 border-t border-paper-line pt-3">
              {!user ? (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-paper-line px-4 py-2.5 text-center text-sm font-semibold text-ink"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-ink px-4 py-2.5 text-center text-sm font-semibold text-on-ink"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={isAdmin ? "/admin" : "/dashboard"}
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-ink px-4 py-2.5 text-center text-sm font-semibold text-on-ink"
                  >
                    {isAdmin ? "Admin Portal" : "Dashboard"}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-full border border-paper-line px-4 py-2.5 text-center text-sm font-semibold text-rose-deep"
                  >
                    Log out
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
