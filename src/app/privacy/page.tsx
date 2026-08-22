export const metadata = { title: "Privacy Policy — Backseat" };

const SECTIONS = [
  { title: "What we collect", body: "Name, email, phone number, and, for riders, vehicle details. When you donate, we record the amount, timestamp, and transaction reference — never your card, bank, or UPI PIN details." },
  { title: "How we use it", body: "To operate ride matching, verify identity and vehicles, process and receipt donations, maintain safety records, and show you your own dashboard and history." },
  { title: "What we never do", body: "We never sell your personal data. We never expose your phone number, exact address, or payment details publicly. Public profiles show only your name (or your chosen display preference), vehicle type, and aggregate statistics." },
  { title: "Leaderboard display", body: "You control how your name appears on the Top Contributors leaderboard: full name, first name with initial, or fully anonymous. This can be changed at any time from your profile." },
  { title: "Data retention", body: "Donation and ride records are retained for audit, fraud-prevention, and charity-reporting purposes, in line with applicable financial record-keeping requirements." },
  { title: "Your rights", body: "You can review and update your profile information at any time, and can request account deletion by contacting support, subject to records we're legally required to retain." },
  { title: "Safety data", body: "Reports, blocks, and SOS alerts are visible only to our safety and admin team, and are used solely to keep the platform safe." },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl text-ink">Privacy Policy</h1>
      <p className="mt-4 text-text-soft">Last updated August 2026.</p>

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
