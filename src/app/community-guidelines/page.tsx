export const metadata = { title: "Community Guidelines — Backseat" };

const SECTIONS = [
  {
    title: "The spirit of Backseat",
    body: "This platform exists so people already travelling alone can share what they already have — a spare seat — with someone going the same way. Everyone here should treat that generosity with respect, whether they're offering a ride or receiving one.",
  },
  {
    title: "No fares, ever",
    body: "Riders and drivers may never ask a passenger for money, set a price, or hint that payment is expected in exchange for the ride. Any attempt to do so is a serious violation and will result in account suspension.",
  },
  {
    title: "Donations are always voluntary",
    body: "Passengers decide entirely for themselves whether to donate and how much. No one — rider, passenger, or platform — should pressure, guilt, or persuade another person into giving a specific amount.",
  },
  {
    title: "Be honest in your profile",
    body: "Use your real name, an accurate vehicle description, and your own photo. Impersonation or fake vehicle details will get an account permanently removed.",
  },
  {
    title: "Treat every journey with respect",
    body: "Be on time, communicate clearly, and treat your travel companion the way you'd want to be treated. Harassment, discrimination, or unsafe driving are never tolerated.",
  },
  {
    title: "Report what doesn't feel right",
    body: "If something feels unsafe or dishonest, report it. Our safety team reviews every report and can suspend accounts pending investigation.",
  },
];

export default function CommunityGuidelinesPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl text-ink">Community Guidelines</h1>
      <p className="mt-4 text-text-soft">
        These guidelines exist to keep Backseat a safe, honest, and genuinely charitable
        place. Violating them can result in warnings, suspension, or permanent removal from the
        platform.
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="font-display text-xl text-ink">{s.title}</h2>
            <p className="mt-2 leading-relaxed text-text-soft">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
