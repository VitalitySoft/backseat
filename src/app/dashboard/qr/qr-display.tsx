"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import { Copy, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QrDisplay({ charityCode, riderName }: { charityCode: string; riderName: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [origin, setOrigin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  useEffect(() => {
    if (!origin && typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, [origin]);

  const url = origin ? `${origin}/donate/${charityCode}` : "";

  async function copyLink() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function regenerate() {
    if (!confirm("Regenerating creates a new QR code. Any old printed/shared QR will stop working. Continue?")) return;
    setRegenerating(true);
    await fetch("/api/rider/qr/regenerate", { method: "POST" });
    setRegenerating(false);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm rounded-3xl border border-paper-line bg-white p-8 text-center shadow-sm">
      <p className="font-display text-lg text-ink">{riderName}&apos;s Charity QR</p>
      <p className="mt-1 text-xs text-text-soft">Ask your passenger to scan this after the ride</p>

      <div className="mx-auto mt-6 flex w-fit items-center justify-center rounded-2xl border-4 border-paper-dim bg-white p-4">
        {url ? (
          <QRCodeSVG value={url} size={220} level="M" fgColor="#1e2749" bgColor="#ffffff" />
        ) : (
          <div className="h-[220px] w-[220px] animate-pulse rounded-xl bg-paper-dim" />
        )}
      </div>

      <p className="mt-4 break-all font-mono text-[11px] text-text-soft">{url}</p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" size="sm" className="flex-1" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button variant="ghost" size="sm" className="flex-1" onClick={regenerate} disabled={regenerating}>
          <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
          Regenerate
        </Button>
      </div>

      <p className="mt-5 rounded-xl bg-banyan-pale px-3 py-2 text-[11px] leading-relaxed text-banyan-deep">
        This code only identifies you for credit — all donations are paid directly to our
        registered charity beneficiary. You cannot change where the money goes.
      </p>
    </div>
  );
}
