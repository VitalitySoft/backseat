"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AuthForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text">Full name</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
          placeholder="Ravi Kumar"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text">Email</label>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
          placeholder="you@gmail.com"
        />
        <p className="mt-1.5 text-xs text-text-soft">
          Use a real email — you'll log in with a one-time code sent here, no password needed.
        </p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text">Phone (optional)</label>
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
          placeholder="+91 98100 00000"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-rose-pale px-4 py-2.5 text-sm text-rose-deep">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Please wait…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-text-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-marigold-deep hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
