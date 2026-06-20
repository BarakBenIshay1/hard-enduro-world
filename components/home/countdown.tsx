"use client";

import { useEffect, useMemo, useState } from "react";

type CountdownProps = {
  targetDate: string;
};

type TimePart = {
  label: string;
  value: string;
};

function getTimeParts(targetDate: string): TimePart[] {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = Math.max(target - now, 0);
  const day = 1000 * 60 * 60 * 24;
  const hour = 1000 * 60 * 60;
  const minute = 1000 * 60;

  const days = Math.floor(diff / day);
  const hours = Math.floor((diff % day) / hour);
  const minutes = Math.floor((diff % hour) / minute);
  const seconds = Math.floor((diff % minute) / 1000);

  return [
    { label: "Days", value: String(days).padStart(2, "0") },
    { label: "Hours", value: String(hours).padStart(2, "0") },
    { label: "Min", value: String(minutes).padStart(2, "0") },
    { label: "Sec", value: String(seconds).padStart(2, "0") },
  ];
}

export function Countdown({ targetDate }: CountdownProps) {
  const fallback = useMemo(() => getTimeParts(targetDate), [targetDate]);
  const [parts, setParts] = useState<TimePart[]>(fallback);

  useEffect(() => {
    const update = () => setParts(getTimeParts(targetDate));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-4 gap-2" aria-label="Countdown timer">
      {parts.map((part) => (
        <div
          key={part.label}
          className="rounded-md border border-white/12 bg-white/[0.07] p-3 text-center shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08)]"
        >
          <p className="font-mono text-2xl font-semibold tabular-nums text-white sm:text-3xl">
            {part.value}
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/46">
            {part.label}
          </p>
        </div>
      ))}
    </div>
  );
}
