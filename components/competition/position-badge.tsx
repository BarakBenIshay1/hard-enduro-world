import { formatOptional } from "@/lib/format";
import { cn } from "@/lib/cn";

type PositionBadgeProps = {
  position: number | null;
};

export function PositionBadge({ position }: PositionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-10 items-center justify-center rounded-sm border border-border bg-surface-muted px-2.5 py-1 text-sm font-black",
        position === 1 && "border-gold/38 bg-gold/12 text-gold",
        position === 2 && "border-white/20 bg-white/10 text-foreground",
        position === 3 && "border-accent/34 bg-accent/12 text-accent",
      )}
    >
      {formatOptional(position)}
    </span>
  );
}
