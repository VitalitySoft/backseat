import { AuthForm } from "@/components/auth-form";
import { HandHeart } from "lucide-react";

export const metadata = { title: "Create an account — Backseat" };

export default function RegisterPage() {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-5xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-2">
      <div>
        <h1 className="font-display text-3xl text-ink">Join Backseat</h1>
        <p className="mt-2 text-text-soft">
          Create your account to offer a seat, find a ride, or support a journey with a donation.
        </p>
        <div className="mt-8">
          <AuthForm />
        </div>
      </div>
      <div className="hidden rounded-3xl bg-ink px-10 py-14 text-on-ink lg:block">
        <HandHeart className="h-10 w-10 text-marigold" />
        <p className="mt-6 font-display text-2xl leading-snug">
          One account, two ways to help: share a seat when you&apos;re driving, or support a
          rider&apos;s charity when you&apos;re not.
        </p>
        <p className="mt-4 text-sm text-on-ink-soft">
          No fares are ever collected on this platform.
        </p>
      </div>
    </div>
  );
}
