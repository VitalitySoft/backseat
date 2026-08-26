import Image from "next/image";
import { HeartHandshake, Compass, Users, ShieldCheck } from "lucide-react";

export const metadata = { title: "About Us — Backseat" };

const VALUES = [
  { icon: HeartHandshake, title: "Kindness first", body: "Every feature we build is designed to protect one idea: giving should always be a choice, never an expectation." },
  { icon: Compass, title: "Journeys, not transactions", body: "We don't route fares or set prices. We simply help people who are already travelling the same way find each other." },
  { icon: ShieldCheck, title: "Trust through transparency", body: "Verification, audit trails, and public impact reporting exist so every rupee and every ride can be trusted." },
  { icon: Users, title: "Community over competition", body: "Our leaderboard celebrates generosity — it never pressures anyone to give more than they wish to." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl text-ink">About Backseat</h1>
      <p className="mt-4 text-lg leading-relaxed text-text-soft">
        The name says it all: there&apos;s a seat behind you that&apos;s empty right now. Millions
        of people drive or ride alone every day, past countless others heading the exact same
        way. Backseat exists to turn that overlap into something meaningful: a free seat shared,
        and, if the passenger wishes, a small act of generosity passed on to people who need it
        more.
      </p>
      <p className="mt-4 leading-relaxed text-text-soft">
        We are not a ride-hailing company. We never set prices, take commissions, or route
        payments to riders. Our only role is to connect people already on the same journey, and
        to make it effortless and safe for a passenger to support a registered charity if they
        feel moved to.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {VALUES.map((v) => (
          <div key={v.title} className="rounded-2xl border border-paper-line bg-white p-6">
            <v.icon className="h-6 w-6 text-marigold-deep" />
            <p className="mt-3 font-display text-lg text-ink">{v.title}</p>
            <p className="mt-1 text-sm text-text-soft">{v.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-3xl bg-paper-dim/60 p-8 text-center">
        <p className="font-display text-xl text-ink">
          &ldquo;If you&apos;re already going somewhere, take someone along.&rdquo;
        </p>
        <p className="mt-2 text-sm text-text-soft">That&apos;s the whole idea. Everything else is just making it safe and simple.</p>
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-2">
        <p className="text-center text-xs text-text-soft">Ideology, implemented and maintained by</p>
        <Image src="/vitalitysoft-logo.png" alt="VitalitySoft" width={1482} height={346} className="h-10 w-auto" />
      </div>
    </div>
  );
}
