import { LoginForm } from "@/components/login-form";
import { HeartHandshake } from "lucide-react";

export const metadata = { title: "Log in — Backseat" };

export default function LoginPage() {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-5xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-2">
      <div className="hidden rounded-3xl bg-ink px-10 py-14 text-on-ink lg:block">
        <HeartHandshake className="h-10 w-10 text-marigold" />
        <p className="mt-6 font-display text-2xl leading-snug">
          &ldquo;I was driving to work anyway. Now three mornings a week, someone rides along —
          and the charity fund grows a little more.&rdquo;
        </p>
        <p className="mt-4 text-sm text-on-ink-soft">— A Backseat driver</p>
      </div>
      <div>
        <h1 className="font-display text-3xl text-ink">Welcome back</h1>
        <p className="mt-2 text-text-soft">Log in to continue your journey of kindness.</p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
