"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

export function AdminActionButton({
  url,
  method = "PATCH",
  body,
  label,
  confirmMessage,
  tone = "default",
}: {
  url: string;
  method?: string;
  body: Record<string, unknown>;
  label: string;
  confirmMessage?: string;
  tone?: "default" | "danger" | "success";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (confirmMessage && !confirm(confirmMessage)) return;
    setLoading(true);
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={clsx(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
        tone === "danger" && "bg-rose-pale text-rose-deep hover:bg-rose-deep hover:text-white",
        tone === "success" && "bg-banyan-pale text-banyan-deep hover:bg-banyan hover:text-white",
        tone === "default" && "bg-paper-dim text-ink hover:bg-marigold-pale",
      )}
    >
      {loading ? "…" : label}
    </button>
  );
}
