import { AlertTriangle, TrendingUp, Repeat } from "lucide-react";
import { getFraudSignals } from "@/lib/fraud";

export const metadata = { title: "Admin — Fraud & Suspicious" };
export const dynamic = "force-dynamic";

export default async function AdminFraudPage() {
  const signals = await getFraudSignals();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Fraud &amp; Suspicious Transactions</h1>
      <p className="mt-1 max-w-xl text-sm text-text-soft">
        Automatic heuristics only — high-value gifts and unusually rapid repeat donations between
        the same pair. Nothing here is auto-blocked; review and act from Donations or Users.
      </p>

      <div className="mt-6 space-y-3">
        {signals.length === 0 && (
          <p className="rounded-2xl border border-dashed border-paper-line bg-white px-6 py-10 text-center text-text-soft">
            No suspicious activity flagged right now.
          </p>
        )}
        {signals.map((s) => (
          <div key={s.id} className="flex items-start gap-3 rounded-2xl border border-paper-line bg-white p-5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-pale text-rose-deep">
              {s.type === "HIGH_VALUE" ? <TrendingUp className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-deep" />
                {s.type === "HIGH_VALUE" ? "High-value donation" : "Rapid repeat donations"}
              </p>
              <p className="mt-1 text-sm text-text-soft">{s.description}</p>
              <p className="mt-1 font-mono text-xs text-text-soft">
                {s.donationRef} · {new Date(s.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
