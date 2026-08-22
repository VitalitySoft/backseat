import { Bike, Car, Search, UserPlus, QrCode, HandHeart, ShieldCheck, Ban } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export const metadata = { title: "How It Works — Backseat" };

const RIDER_STEPS = [
  { icon: Bike, title: "Register your vehicle", body: "Add your two-wheeler or four-wheeler details once. No fare or fee to set — there's no field for it." },
  { icon: ShieldCheck, title: "Get verified", body: "Our team checks your vehicle details before your charity QR goes live, so passengers can trust who they're riding with." },
  { icon: Search, title: "Offer your route", body: "Whenever you're heading somewhere, publish your start point, destination, and spare seats." },
  { icon: QrCode, title: "Show your Charity QR", body: "At the end of the ride, display your personal QR. It only identifies you for credit — never for payment to you." },
];

const PASSENGER_STEPS = [
  { icon: Search, title: "Search your route", body: "Find verified riders already heading your way." },
  { icon: UserPlus, title: "Request to join", body: "Send a request. The rider accepts, and you travel together — completely free." },
  { icon: QrCode, title: "Scan the QR", body: "After the ride, scan the rider's charity QR if you'd like to give back." },
  { icon: HandHeart, title: "Donate any amount", body: "Type in whatever you wish — or nothing at all. It goes straight to our charity partners." },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <h1 className="font-display text-4xl text-ink">How Backseat Works</h1>
        <p className="mx-auto mt-3 max-w-xl text-text-soft">
          One simple idea: if you're already going somewhere, take someone along. They don't
          have to pay you — but if they wish, they can turn the journey into an act of kindness.
        </p>
      </div>

      <div className="mt-14">
        <h2 className="font-display text-2xl text-ink">For riders &amp; drivers</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {RIDER_STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-paper-line bg-white p-5">
              <span className="font-mono text-xs text-marigold-deep">0{i + 1}</span>
              <s.icon className="mt-2 h-6 w-6 text-ink" />
              <p className="mt-3 font-display text-lg text-ink">{s.title}</p>
              <p className="mt-1 text-sm text-text-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14">
        <h2 className="font-display text-2xl text-ink">For passengers</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {PASSENGER_STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-paper-line bg-white p-5">
              <span className="font-mono text-xs text-marigold-deep">0{i + 1}</span>
              <s.icon className="mt-2 h-6 w-6 text-ink" />
              <p className="mt-3 font-display text-lg text-ink">{s.title}</p>
              <p className="mt-1 text-sm text-text-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 rounded-3xl bg-ink px-8 py-10 text-on-ink">
        <p className="flex items-center gap-2 font-display text-xl">
          <Ban className="h-5 w-5 text-marigold" /> What Backseat is not
        </p>
        <ul className="mt-4 space-y-2 text-sm text-on-ink-soft">
          <li>• Not a taxi or fare-based transport service — there is no price list, meter, or booking fee.</li>
          <li>• Riders cannot set, request, or negotiate an amount, on the app or in person.</li>
          <li>• Passengers are never required to pay anything to travel.</li>
          <li>• Donations, when made, go only to our registered charity partners — never to a rider's account.</li>
        </ul>
      </div>

      <div className="mt-14 flex flex-wrap justify-center gap-4">
        <LinkButton href="/offer-a-ride" size="lg">Offer a Ride</LinkButton>
        <LinkButton href="/find-a-ride" variant="outline" size="lg">Find a Ride</LinkButton>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-text-soft">
        <Car className="h-4 w-4" /> Read more about safety on our{" "}
        <a href="/safety" className="font-semibold text-marigold-deep hover:underline">Safety Centre</a>
      </div>
    </div>
  );
}
