import Link from "next/link";
import { ShieldCheck, Phone, Car, Flag, ShieldOff, Share2, BookOpen } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { SosButton } from "@/components/sos-button";

export const metadata = { title: "Safety Centre — Backseat" };
export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: ShieldCheck, title: "Verified profiles", body: "Every account requires a verified email before it can join or offer rides." },
  { icon: Phone, title: "Phone verification", body: "We confirm phone numbers so riders and passengers can be reached if needed." },
  { icon: Car, title: "Vehicle verification", body: "A rider's charity QR only goes live after our team checks their vehicle details." },
  { icon: Flag, title: "Report a user", body: "Flag unsafe driving or behaviour from any profile — our safety team reviews every report." },
  { icon: ShieldOff, title: "Block a user", body: "Instantly stop being matched with anyone you'd rather not travel with again." },
  { icon: Share2, title: "Share ride details", body: "Send your route and rider details to a friend or family member before you set off." },
];

export default async function SafetyPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">Safety Centre</h1>
          <p className="mt-3 max-w-lg text-text-soft">
            You&apos;re travelling with someone you may not know. Here&apos;s everything we do
            — and everything you can do — to keep that safe.
          </p>
        </div>
        <SosButton loggedIn={Boolean(user)} />
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-paper-line bg-white p-5">
            <f.icon className="h-6 w-6 text-marigold-deep" />
            <p className="mt-3 font-display text-lg text-ink">{f.title}</p>
            <p className="mt-1 text-sm text-text-soft">{f.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-3xl bg-banyan-pale p-6">
        <p className="flex items-center gap-2 font-display text-lg text-banyan-deep">
          <BookOpen className="h-5 w-5" /> Before you travel
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-banyan-deep">
          <li>• Check the rider or passenger&apos;s verification badge before confirming.</li>
          <li>• Share your ride details — route, rider name, vehicle — with someone you trust.</li>
          <li>• Meet in a public, well-lit location whenever possible.</li>
          <li>• Trust your instincts. You can cancel a ride request at any time, no explanation needed.</li>
        </ul>
      </div>

      <div className="mt-10 rounded-3xl bg-ink p-6 text-on-ink">
        <p className="font-display text-lg">In an emergency</p>
        <p className="mt-2 text-sm text-on-ink-soft">
          Call 112 (India&apos;s national emergency number) immediately if you or someone else is
          in danger. Use the SOS button above to also alert our safety team.
        </p>
      </div>

      <p className="mt-10 text-center text-sm text-text-soft">
        Read our{" "}
        <Link href="/community-guidelines" className="font-semibold text-marigold-deep hover:underline">
          Community Guidelines
        </Link>{" "}
        for the full standard of conduct expected on Backseat.
      </p>
    </div>
  );
}
