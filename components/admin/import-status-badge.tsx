import { cn } from "@/lib/cn";

type ImportStatusBadgeProps = {
  status: string;
};

export function ImportStatusBadge({ status }: ImportStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        status === "COMPLETED" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        status === "NEEDS_REVIEW" && "border-gold/30 bg-gold/10 text-gold",
        status === "PENDING" && "border-accent/30 bg-accent/10 text-accent",
        status === "RUNNING" && "border-accent/30 bg-accent/10 text-accent",
        status === "FAILED" && "border-red-500/30 bg-red-500/10 text-red-400",
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
