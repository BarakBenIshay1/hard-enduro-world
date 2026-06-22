import { Database } from "lucide-react";
import { cn } from "@/lib/cn";

type SourceBadgeProps = {
  reliability: string;
};

export function SourceBadge({ reliability }: SourceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        reliability === "OFFICIAL" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        reliability === "TRUSTED" && "border-accent/30 bg-accent/10 text-accent",
        reliability === "COMMUNITY" && "border-gold/30 bg-gold/10 text-gold",
        reliability === "UNKNOWN" &&
          "border-border bg-surface-muted text-foreground/[0.58]",
      )}
    >
      <Database className="h-3.5 w-3.5" aria-hidden="true" />
      {reliability}
    </span>
  );
}
