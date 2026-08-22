import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "ink" | "outline" | "ghost" | "rose" | "banyan" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-marigold";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-marigold text-ink hover:bg-marigold-deep hover:text-on-ink shadow-sm hover:shadow-md",
  ink: "bg-ink text-on-ink hover:bg-ink-soft shadow-sm hover:shadow-md",
  outline: "border border-paper-line bg-white/60 text-ink hover:border-marigold hover:bg-marigold-pale/40",
  ghost: "text-ink hover:bg-paper-dim",
  rose: "bg-rose text-white hover:bg-rose-deep",
  banyan: "bg-banyan text-white hover:bg-banyan-deep",
  danger: "bg-rose-pale text-rose-deep hover:bg-rose-deep hover:text-white",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className = "") {
  return clsx(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
