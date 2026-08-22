export const metadata = { title: "Legal & Compliance — Backseat" };

const SECTIONS = [
  {
    title: "Not a transportation service",
    body: "Backseat is a technology platform that helps people who are already making a journey share a spare seat with someone travelling the same way. We do not employ drivers, dispatch vehicles, set routes, or charge fares. We are not a taxi, cab-aggregator, or public transport operator, and we do not hold — nor do we require — the licenses applicable to those businesses.",
  },
  {
    title: "No fare, ever",
    body: "The platform's technical design deliberately has no field, setting, or workflow through which a rider can set, request, or receive a fare or fee for transportation. This is enforced at the application and database level, not only in the interface.",
  },
  {
    title: "Donations are charitable contributions",
    body: "Any amount a passenger chooses to give is a voluntary donation to our registered charity partner, routed directly to that charity's beneficiary account. It is not consideration for transportation and is never paid to, or redirected by, the rider.",
  },
  {
    title: "Tax treatment",
    body: "Donations made through this platform may or may not qualify for tax deduction depending on your jurisdiction and the specific charity's registration status. Where a donation is eligible, a receipt indicating eligibility will be issued by the charity. Consult a qualified tax advisor for guidance specific to you.",
  },
  {
    title: "Payment processing",
    body: "Donations are processed via UPI. Backseat does not store card numbers, bank credentials, or UPI PINs. Payment confirmation and settlement are handled by regulated payment infrastructure; this platform only records the resulting transaction reference for auditing and receipting.",
  },
  {
    title: "Charity partner accountability",
    body: "Charity beneficiary details are configured and controlled by Backseat's compliance team, not by individual riders. Riders cannot view, edit, or redirect the beneficiary account under any circumstances.",
  },
  {
    title: "Before production launch",
    body: "This platform's legal, charity-registration, payment-gateway, and transportation-regulatory setup should be reviewed by qualified legal counsel in every jurisdiction where it operates before real donations are processed or real rides are offered.",
  },
];

export default function DisclaimersPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl text-ink">Legal &amp; Compliance</h1>
      <p className="mt-4 text-text-soft">
        A summary of how Backseat is structured to comply with charity, payment, and
        transportation regulations. This page is informational and does not constitute legal
        advice.
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
