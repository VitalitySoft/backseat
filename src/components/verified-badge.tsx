import { ShieldCheck, Trophy } from "lucide-react";
import clsx from "clsx";

const TONES = {
  banyan: "bg-banyan-pale text-banyan-deep",
  marigold: "bg-marigold-pale text-marigold-deep",
};

export function VerifiedBadge({
  className,
  label = "Verified",
  tone = "banyan",
  icon = "shield",
}: {
  className?: string;
  label?: string;
  tone?: keyof typeof TONES;
  icon?: "shield" | "trophy";
}) {
  const Icon = icon === "trophy" ? Trophy : ShieldCheck;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        TONES[tone],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
