import { cn } from "@/lib/cn";

type ConfidenceBadgeProps = {
  score: number;
};

export function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-sm border px-2.5 py-1 font-mono text-xs font-semibold",
        score >= 90 && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        score >= 70 && score < 90 && "border-accent/30 bg-accent/10 text-accent",
        score < 70 && "border-red-500/30 bg-red-500/10 text-red-400",
      )}
    >
      {score}%
    </span>
  );
}
