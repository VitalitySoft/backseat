"use client";

import { useState } from "react";
import { Download, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReceiptActions() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Backseat donation receipt", url });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row print:hidden">
      <Button variant="outline" className="flex-1" onClick={() => window.print()}>
        <Download className="h-4 w-4" /> Download / Print
      </Button>
      <Button variant="ghost" className="flex-1" onClick={share}>
        {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        {copied ? "Link copied" : "Share receipt"}
      </Button>
    </div>
  );
}
