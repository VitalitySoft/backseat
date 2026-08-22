export const metadata = { title: "Terms of Use — Backseat" };

const SECTIONS = [
  { title: "1. Acceptance", body: "By creating an account or using Backseat, you agree to these terms, our Privacy Policy, and our Community Guidelines." },
  { title: "2. What Backseat is", body: "A platform connecting people already making a journey with others travelling the same way, and facilitating voluntary donations to registered charity partners. It is not a transportation, taxi, or fare-collection service." },
  { title: "3. Eligibility", body: "You must be at least 18 years old and hold a valid driving licence to register as a rider. Accurate identity and vehicle information is required." },
  { title: "4. No fares", body: "Riders may never request, imply, or accept payment for transportation. Any such conduct is grounds for immediate suspension." },
  { title: "5. Donations", body: "Donations are voluntary, set entirely by the passenger, and paid directly to our registered charity partner. Backseat and its riders have no claim to donated funds." },
  { title: "6. Conduct", body: "You agree to behave respectfully, provide accurate information, and comply with our Community Guidelines and applicable law." },
  { title: "7. Verification", body: "We may verify identity, phone, email, and vehicle details before enabling certain features, including an active charity QR." },
  { title: "8. Liability", body: "Backseat facilitates introductions between independent individuals. We are not a party to, and assume no liability for, the conduct of riders or passengers during a shared journey, to the maximum extent permitted by law." },
  { title: "9. Suspension & termination", body: "We may suspend or terminate accounts that violate these terms, attempt to charge fares, submit fraudulent information, or engage in unsafe conduct." },
  { title: "10. Changes", body: "We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance." },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl text-ink">Terms of Use</h1>
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
