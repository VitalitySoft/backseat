import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BecomeARiderForm } from "./become-a-rider-form";

export const metadata = { title: "Become a Charity Rider — Backseat" };

export default async function BecomeARiderPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/become-a-rider");
  if (user.role === "ADMIN") redirect("/admin");
  if (user.riderProfile) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl text-ink sm:text-4xl">Become a Charity Rider</h1>
      <p className="mt-3 text-text-soft">
        Tell us about the vehicle you already drive. We&apos;ll never ask you to set a price —
        just your seats, your route, and your willingness to share the ride.
      </p>
      <div className="mt-10 rounded-3xl border border-paper-line bg-white p-6 sm:p-8">
        <BecomeARiderForm />
      </div>
    </div>
  );
}
