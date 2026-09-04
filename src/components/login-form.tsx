"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Step = "email" | "otp" | "password";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      if (data.method === "password") {
        setStep("password");
      } else {
        setDevOtp(data.devOtp ?? null);
        setCode("");
        setStep("otp");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
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

  async function loginWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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

  if (step === "otp") {
    return (
      <form onSubmit={verifyOtp} className="space-y-4">
        <div>
          <p className="text-sm text-text-soft">
            We sent a 6-digit code to <span className="font-semibold text-ink">{email}</span>.
          </p>
          {devOtp && (
            <p className="mt-2 rounded-xl bg-marigold-pale/60 px-4 py-2.5 text-sm text-marigold-deep">
              Dev mode (no email service configured yet): your code is{" "}
              <span className="font-mono font-bold">{devOtp}</span>. It's also logged on the server console.
            </p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">6-digit code</label>
          <input
            required
            inputMode="numeric"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-center text-lg font-mono tracking-[0.5em] outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
            placeholder="000000"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-rose-pale px-4 py-2.5 text-sm text-rose-deep">{error}</p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading || code.length !== 6}>
          {loading ? "Verifying…" : "Verify & log in"}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError(null);
            }}
            className="font-semibold text-text-soft hover:text-ink"
          >
            ← Change email
          </button>
          <button
            type="button"
            onClick={requestOtp}
            disabled={loading}
            className="font-semibold text-marigold-deep hover:underline"
          >
            Resend code
          </button>
        </div>
      </form>
    );
  }

  if (step === "password") {
    return (
      <form onSubmit={loginWithPassword} className="space-y-4">
        <p className="text-sm text-text-soft">
          Signing in as <span className="font-semibold text-ink">{email}</span>
        </p>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Password</label>
          <input
            required
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-rose-pale px-4 py-2.5 text-sm text-rose-deep">{error}</p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Please wait…" : "Log in"}
        </Button>

        <button
          type="button"
          onClick={() => {
            setStep("email");
            setError(null);
          }}
          className="block w-full text-center text-sm font-semibold text-text-soft hover:text-ink"
        >
          ← Change email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={requestOtp} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text">Email</label>
        <input
          required
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-paper-line bg-white px-4 py-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30"
          placeholder="you@gmail.com"
        />
        <p className="mt-1.5 text-xs text-text-soft">We'll send a one-time code to this email.</p>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-pale px-4 py-2.5 text-sm text-rose-deep">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Sending code…" : "Send code"}
      </Button>

      <p className="text-center text-sm text-text-soft">
        New here?{" "}
        <Link href="/register" className="font-semibold text-marigold-deep hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
