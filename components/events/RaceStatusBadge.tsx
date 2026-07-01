import { CalendarDays, Flag, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { RaceStatusView } from "./race-status";

type RaceStatusBadgeProps = {
  raceStatus: RaceStatusView;
  className?: string;
};

export function RaceStatusBadge({ raceStatus, className }: RaceStatusBadgeProps) {
  const Icon =
    raceStatus.phase === "live-now"
      ? Radio
      : raceStatus.phase === "race-completed"
        ? Flag
        : CalendarDays;

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em]",
        raceStatus.phase === "coming-soon" &&
          "border-sky-400/60 bg-sky-500/15 text-sky-100 shadow-[0_0_22px_hsl(199_89%_48%/0.22)]",
        raceStatus.phase === "live-now" &&
          "animate-pulse border-red-400/70 bg-red-500/25 text-red-50 shadow-[0_0_28px_hsl(0_84%_60%/0.44)]",
        raceStatus.phase === "race-completed" &&
          "border-emerald-400/60 bg-emerald-500/15 text-emerald-100 shadow-[0_0_22px_hsl(151_76%_45%/0.24)]",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {raceStatus.label}
    </Badge>
  );
}
