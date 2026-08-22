"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LEADERBOARD_DISPLAY } from "@/lib/constants";

const DISPLAY_LABELS: Record<string, string> = {
  FULL_NAME: "Show my full name",
  FIRST_NAME_INITIAL: "Show first name + initial (e.g. Ravi K.)",
  ANONYMOUS: "Show anonymously (\"A kind traveller\")",
};

export function ProfileForm({
  initialName,
  initialPhone,
  initialDisplay,
}: {
  initialName: string;
  initialPhone: string;
  initialDisplay: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [leaderboardDisplay, setLeaderboardDisplay] = useState(initialDisplay);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, leaderboardDisplay }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text">Full name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text">Phone</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98100 00000"
          className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-text">
          How should you appear on the Top Contributors leaderboard?
        </label>
        <div className="space-y-2">
          {LEADERBOARD_DISPLAY.map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                leaderboardDisplay === opt ? "border-marigold bg-marigold-pale/30" : "border-paper-line"
              }`}
            >
              <input
                type="radio"
                name="display"
                checked={leaderboardDisplay === opt}
                onChange={() => setLeaderboardDisplay(opt)}
                className="accent-marigold"
              />
              {DISPLAY_LABELS[opt]}
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
      </Button>
    </form>
  );
}
