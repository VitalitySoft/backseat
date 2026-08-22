export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 30C10 30 10 20 17 20C24 20 24 10 31 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="0.5 7"
      />
      <path
        d="M31 16C34.3 16 37 13.3 37 10C37 7.5 35.3 6 33.3 6C31.8 6 31 7 31 7C31 7 30.2 6 28.7 6C26.7 6 25 7.5 25 10C25 13.3 27.7 16 31 16Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Logo({ className = "", markClassName = "" }: { className?: string; markClassName?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display ${className}`}>
      <LogoMark className={`h-7 w-7 text-marigold ${markClassName}`} />
      <span className="text-lg tracking-tight">Backseat</span>
    </span>
  );
}
