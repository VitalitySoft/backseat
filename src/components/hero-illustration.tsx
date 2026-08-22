"use client";

import { motion } from "framer-motion";
import { Bike, Car, UserPlus, QrCode, Heart, MapPin } from "lucide-react";

const WAYPOINTS = [
  { x: 15, y: 10, icon: MapPin, label: "You're already heading out", tone: "bg-on-ink text-ink" },
  { x: 27, y: 28, icon: Bike, label: "Two-wheeler offers a seat", tone: "bg-marigold text-ink" },
  { x: 58, y: 36, icon: Car, label: "Four-wheeler offers a seat", tone: "bg-marigold text-ink" },
  { x: 75, y: 58, icon: UserPlus, label: "A passenger joins, freely", tone: "bg-rose text-white" },
  { x: 38, y: 75, icon: QrCode, label: "They scan the charity QR", tone: "bg-on-ink text-ink" },
  { x: 70, y: 91, icon: Heart, label: "Charity receives their gift", tone: "bg-banyan text-white" },
];

const PATH =
  "M60,50 C110,90 85,120 108,140 C150,160 210,145 232,180 C258,220 258,255 300,290 C258,320 175,335 152,375 C168,405 245,415 280,455";

export function HeroIllustration() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
      <svg
        viewBox="0 0 400 500"
        className="absolute inset-0 h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        <motion.path
          d={PATH}
          stroke="url(#routeGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="routeGradient" x1="0" y1="0" x2="400" y2="500" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#e8a33d" />
            <stop offset="0.5" stopColor="#e2697d" />
            <stop offset="1" stopColor="#3f7566" />
          </linearGradient>
        </defs>
      </svg>

      {WAYPOINTS.map((wp, i) => {
        const Icon = wp.icon;
        return (
          <motion.div
            key={i}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
            style={{ left: `${wp.x}%`, top: `${wp.y}%` }}
            initial={{ opacity: 0, scale: 0.6, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.28, duration: 0.5, ease: "easeOut" }}
          >
            <motion.span
              className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg shadow-ink/20 ring-4 ring-ink/40 ${wp.tone}`}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            >
              <Icon className="h-5 w-5" />
            </motion.span>
            <span className="hidden max-w-[7.5rem] text-center text-[11px] font-medium leading-tight text-on-ink-soft sm:block">
              {wp.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
