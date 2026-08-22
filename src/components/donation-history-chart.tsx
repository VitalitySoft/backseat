"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
} from "date-fns";

type Granularity = "day" | "week" | "month" | "year";

const GRANULARITY_CONFIG: Record<
  Granularity,
  { count: number; bucketStart: (d: Date) => Date; step: (d: Date, n: number) => Date; label: string; fmt: string }
> = {
  day: { count: 14, bucketStart: startOfDay, step: subDays, label: "Day", fmt: "d MMM" },
  week: { count: 10, bucketStart: (d) => startOfWeek(d, { weekStartsOn: 1 }), step: subWeeks, label: "Week", fmt: "d MMM" },
  month: { count: 12, bucketStart: startOfMonth, step: subMonths, label: "Month", fmt: "MMM ''yy" },
  year: { count: 5, bucketStart: startOfYear, step: subYears, label: "Year", fmt: "yyyy" },
};

export function DonationHistoryChart({ donations }: { donations: { date: string; amount: number }[] }) {
  const [granularity, setGranularity] = useState<Granularity>("month");

  const data = useMemo(() => {
    const config = GRANULARITY_CONFIG[granularity];
    const now = new Date();
    const buckets: { key: string; label: string; amount: number }[] = [];
    for (let i = config.count - 1; i >= 0; i--) {
      const bucketDate = config.bucketStart(config.step(now, i));
      buckets.push({ key: bucketDate.toISOString(), label: format(bucketDate, config.fmt), amount: 0 });
    }
    for (const donation of donations) {
      const bucketDate = config.bucketStart(new Date(donation.date));
      const key = bucketDate.toISOString();
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.amount += donation.amount;
    }
    return buckets;
  }, [donations, granularity]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(GRANULARITY_CONFIG) as Granularity[]).map((g) => (
          <button
            key={g}
            onClick={() => setGranularity(g)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              granularity === g ? "bg-ink text-on-ink" : "bg-paper-dim text-text-soft hover:text-ink"
            }`}
          >
            {GRANULARITY_CONFIG[g].label}
          </button>
        ))}
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="donationFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8a33d" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#e8a33d" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="#e3d9c2" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5b5f72" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#5b5f72" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${v}`}
              width={56}
            />
            <Tooltip
              formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Donated"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e3d9c2",
                fontSize: 12,
                background: "#fbf6ec",
              }}
            />
            <Area type="monotone" dataKey="amount" stroke="#c47f22" strokeWidth={2} fill="url(#donationFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
