"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DONATION_QUICK_AMOUNTS } from "@/lib/constants";

type Step = "amount" | "pay";

export function DonateForm({ charityCode, rideJoinId, loggedIn }: { charityCode: string; rideJoinId?: string; loggedIn: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState<string>("");
  const [donorName, setDonorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [payload, setPayload] = useState<{ donationId: string; donationRef: string; upiLink: string } | null>(null);

  const numericAmount = Number(amount);
  const validAmount = amount.trim() !== "" && Number.isFinite(numericAmount) && numericAmount > 0;

  async function proceedToPay() {
    setError(null);
    if (!validAmount) {
      setError("Enter an amount greater than ₹0");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/donate/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        charityCode,
        amount: numericAmount,
        rideJoinId,
        donorName: loggedIn ? undefined : donorName || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }
    setPayload(data);
    setStep("pay");
    setLoading(false);
  }

  async function confirmPayment() {
    if (!payload) return;
    setConfirming(true);
    const res = await fetch("/api/donate/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donationId: payload.donationId, donationRef: payload.donationRef }),
    });
    const data = await res.json().catch(() => ({}));
    setConfirming(false);
    if (!res.ok) {
      setError(data.error ?? "We couldn't confirm this payment yet.");
      return;
    }
    router.push(`/donate/receipt/${payload.donationId}`);
  }

  if (step === "pay" && payload) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-paper-dim/70 px-5 py-4 text-center">
          <p className="text-xs uppercase tracking-wide text-text-soft">You&apos;re donating</p>
          <p className="mt-1 font-display text-3xl text-ink">₹{numericAmount.toLocaleString("en-IN")}</p>
          <p className="mt-1 font-mono text-[11px] text-text-soft">Ref: {payload.donationRef}</p>
        </div>

        <a
          href={payload.upiLink}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-marigold px-6 py-3.5 text-sm font-semibold text-ink hover:bg-marigold-deep"
        >
          <ExternalLink className="h-4 w-4" /> Pay via UPI App
        </a>

        <div className="text-center text-xs text-text-soft">
          Complete the payment in your UPI app, then come back and confirm below.
        </div>

        <Button variant="banyan" size="lg" className="w-full" onClick={confirmPayment} disabled={confirming}>
          <CheckCircle2 className="h-4 w-4" />
          {confirming ? "Confirming…" : "I've completed this payment"}
        </Button>

        {error && <p className="text-center text-sm text-rose-deep">{error}</p>}

        <button
          onClick={() => setStep("amount")}
          className="w-full text-center text-xs text-text-soft hover:underline"
        >
          ← Change amount
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium text-text">Tap an amount, or enter your own</p>
        <div className="grid grid-cols-4 gap-2">
          {DONATION_QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(String(a))}
              className={`rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                amount === String(a)
                  ? "border-marigold bg-marigold-pale/50 text-marigold-deep"
                  : "border-paper-line bg-white text-ink hover:border-marigold"
              }`}
            >
              ₹{a}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs text-text-soft">Any amount you wish</label>
          <div className="flex items-center rounded-xl border border-paper-line bg-white px-4 focus-within:border-marigold focus-within:ring-2 focus-within:ring-marigold/30">
            <span className="text-text-soft">₹</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              className="w-full bg-transparent px-2 py-3 text-lg font-semibold text-ink outline-none"
            />
          </div>
        </div>
      </div>

      {!loggedIn && (
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Your name (optional, for your receipt)</label>
          <input
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            placeholder="Anonymous is fine too"
            className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
          />
        </div>
      )}

      {error && <p className="text-sm text-rose-deep">{error}</p>}

      <Button size="lg" className="w-full" onClick={proceedToPay} disabled={loading}>
        {loading ? "Preparing…" : "Continue to Payment"}
      </Button>
    </div>
  );
}
