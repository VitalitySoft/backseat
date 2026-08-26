import Link from "next/link";
import { Bike, Car, QrCode, HandHeart, ShieldCheck, HeartHandshake, Users2 } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { HeroIllustration } from "@/components/hero-illustration";
import { AnimatedCounter } from "@/components/animated-counter";
import { getLeaderboard, getPlatformStats, getLifetimeContributorCount } from "@/lib/stats";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const HOW_IT_WORKS = [
  {
    title: "Offer or find a ride",
    body: "Already travelling alone? Offer your spare seat. Headed the same way? Find someone offering theirs.",
    icon: Bike,
  },
  {
    title: "Travel together, freely",
    body: "No booking fee, no fare negotiation. You simply share the journey you were already making.",
    icon: Car,
  },
  {
    title: "Scan the charity QR",
    body: "At the end of the ride, the rider shows their personal charity QR code — never a payment demand.",
    icon: QrCode,
  },
  {
    title: "Donate, if you wish",
    body: "Choose any amount you like, or none at all. It goes straight to our registered charity partners.",
    icon: HandHeart,
  },
];

const EMPTY_STATS = {
  totalDonated: 0,
  totalDonations: 0,
  totalRides: 0,
  peopleHelped: 0,
  activeRiders: 0,
  monthlyContributors: 0,
};

const EMPTY_LEADERBOARD = [
  {
    riderId: "local-preview",
    displayName: "Start the community",
    totalDonated: 0,
    donationCount: 0,
    vehicleType: "TWO_WHEELER",
    avatarInitial: "B",
  },
];

export default async function HomePage() {
  const [stats, leaderboard, lifetimeContributors] = await Promise.all([
    getPlatformStats(),
    getLeaderboard(5),
    getLifetimeContributorCount(),
  ]).catch(() => [EMPTY_STATS, EMPTY_LEADERBOARD, 0] as const);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-ink-deep via-ink to-ink-soft text-on-ink">
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #e8a33d 0%, transparent 70%)" }}
        />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-marigold-pale">
              A charity ride-sharing movement
            </span>
            <h1 className="mt-6 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              Share Your Journey.
              <br />
              Spread Kindness.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-on-ink-soft">
              If you are travelling alone, offer a seat to someone going your way. They travel
              with you freely — and if they wish, they can contribute any amount to support
              charity.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <LinkButton href="/offer-a-ride" variant="primary" size="lg">
                Offer a Ride
              </LinkButton>
              <LinkButton
                href="/find-a-ride"
                variant="outline"
                size="lg"
                className="border-white/25 bg-white/5 text-on-ink hover:border-marigold hover:bg-white/10"
              >
                Find a Ride
              </LinkButton>
            </div>
            <Link
              href="#how-it-works"
              className="mt-8 inline-flex items-center gap-2 text-sm text-on-ink-soft hover:text-marigold-pale"
            >
              How it works ↓
            </Link>
          </div>
          <HeroIllustration />
        </div>
      </section>

      {/* Impact strip — ticket stubs laid across the fold */}
      <section className="relative z-10 -mt-10 px-4 sm:-mt-12">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Donated so far", value: stats.totalDonated, prefix: "₹" },
            { label: "Charity rides shared", value: stats.totalRides, prefix: "" },
            { label: "People helped", value: stats.peopleHelped, prefix: "" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-paper-line bg-white px-6 py-5 text-center shadow-lg shadow-ink/10"
            >
              <p className="font-display text-3xl text-ink sm:text-4xl">
                <AnimatedCounter value={s.value} prefix={s.prefix} />
              </p>
              <p className="mt-1 text-sm text-text-soft">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Every journey can make a difference */}
      <section className="mx-auto max-w-4xl px-6 pb-4 pt-16 text-center">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">
          Every Journey Can Make a Difference.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-text-soft">
          Backseat never charges a fare. Riders simply share a seat they already have —
          and travellers who feel moved to give can turn that ride into an act of kindness.
        </p>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16 scroll-mt-20">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="relative rounded-3xl border border-paper-line bg-white p-6">
              <span className="font-mono text-xs text-marigold-deep">0{i + 1}</span>
              <div className="mt-3 flex h-11 w-11 items-center justify-center rounded-full bg-paper-dim text-ink">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-soft">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-banyan/30 bg-banyan-pale px-5 py-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-banyan-deep" />
          <p className="text-sm leading-relaxed text-banyan-deep">
            <strong>This is never a fare.</strong> Riders and drivers cannot set, request, or
            receive a required amount. Every donation is entered voluntarily by the passenger and
            paid directly to our registered charity partners — never to the rider&apos;s personal
            account.
          </p>
        </div>
      </section>

      {/* Top contributors preview */}
      <section className="bg-paper-dim/60 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-ink">Top Contributors</h2>
              <p className="mt-2 max-w-md text-sm text-text-soft">
                Ranked purely by voluntary donations already given — never a target, never a
                requirement, just quiet generosity.
              </p>
            </div>
            <Link href="/top-contributors" className="text-sm font-semibold text-marigold-deep hover:underline">
              View full leaderboard →
            </Link>
          </div>

          <ol className="mt-8 space-y-3">
            {leaderboard.map((entry, i) => (
              <li
                key={entry.riderId}
                className="flex items-center gap-4 rounded-2xl border border-paper-line bg-white px-5 py-4"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm ${
                    i === 0 ? "bg-marigold text-ink" : "bg-paper-dim text-text-soft"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-on-ink">
                  {entry.avatarInitial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{entry.displayName}</p>
                  <p className="text-xs text-text-soft">
                    {VEHICLE_TYPE_LABELS[entry.vehicleType as keyof typeof VEHICLE_TYPE_LABELS]} rider ·{" "}
                    {entry.donationCount} donations received
                  </p>
                </div>
                <span className="font-display text-lg text-ink">
                  ₹{entry.totalDonated.toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Monthly contributors", value: stats.monthlyContributors },
              { label: "Lifetime contributors", value: lifetimeContributors },
              { label: "Active riders", value: stats.activeRiders },
              { label: "Charity rides", value: stats.totalRides },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white px-4 py-3 text-center">
                <p className="font-display text-xl text-ink">{s.value.toLocaleString("en-IN")}</p>
                <p className="mt-0.5 text-[11px] text-text-soft">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / final CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-10 rounded-3xl bg-ink px-8 py-12 text-on-ink sm:grid-cols-2 sm:px-12">
          <div>
            <HeartHandshake className="h-9 w-9 text-marigold" />
            <h2 className="mt-4 font-display text-2xl sm:text-3xl">
              If you&apos;re already going somewhere, take someone along.
            </h2>
            <p className="mt-3 text-on-ink-soft">
              They don&apos;t have to pay you. If they wish, they can turn the journey into an
              act of kindness — any amount, entirely their choice.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/offer-a-ride" variant="primary">
                Offer a Ride
              </LinkButton>
              <LinkButton
                href="/charity-impact"
                variant="outline"
                className="border-white/25 bg-transparent text-on-ink hover:border-marigold"
              >
                See where donations go
              </LinkButton>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 border-t border-white/10 pt-6 sm:border-l sm:border-t-0 sm:pl-10 sm:pt-0">
            <div className="flex items-center gap-3">
              <Users2 className="h-5 w-5 text-marigold" />
              <p className="text-sm text-on-ink-soft">
                <span className="font-display text-lg text-on-ink">{stats.peopleHelped}</span> people
                have already travelled together
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-marigold" />
              <p className="text-sm text-on-ink-soft">
                Every rider is identity-verified before their QR goes live
              </p>
            </div>
            <div className="flex items-center gap-3">
              <HandHeart className="h-5 w-5 text-marigold" />
              <p className="text-sm text-on-ink-soft">
                100% of donations route to registered charity partners
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
