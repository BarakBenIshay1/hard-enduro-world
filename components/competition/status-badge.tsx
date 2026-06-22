import { cn } from "@/lib/cn";

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        status === "FINISHED" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        status === "DNF" && "border-red-500/30 bg-red-500/10 text-red-400",
        status === "DNS" && "border-gold/30 bg-gold/10 text-gold",
        status === "DSQ" && "border-accent/30 bg-accent/10 text-accent",
        status === "UNKNOWN" && "border-border bg-surface-muted text-foreground/[0.58]",
      )}
    >
      {status}
    </span>
  );
}
