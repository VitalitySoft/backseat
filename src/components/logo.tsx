/**
 * A rider on a two-wheeler, head turned back over their shoulder — checking on
 * the passenger behind them. The literal image behind the "Backseat" name.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {/* wheels */}
        <circle cx="10" cy="30" r="6" />
        <circle cx="30" cy="30" r="6" />
        {/* frame */}
        <line x1="17" y1="18" x2="10" y2="30" />
        <line x1="17" y1="18" x2="30" y2="30" />
        <line x1="17" y1="18" x2="27" y2="14" />
        <line x1="27" y1="14" x2="30" y2="30" />
        <line x1="15" y1="17.5" x2="19" y2="17.5" />
        {/* rider: torso leaning forward, arm to the handlebar, leg to the pedal */}
        <line x1="17" y1="17" x2="15" y2="8" />
        <line x1="15.5" y1="10" x2="26" y2="14" />
        <line x1="17" y1="17" x2="24" y2="26" />
      </g>
      {/* head, turned back over the shoulder */}
      <circle cx="11.5" cy="6.5" r="3.1" fill="currentColor" />
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
