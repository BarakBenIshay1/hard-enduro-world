import type { ConnectorReviewAction, ConnectorReviewStatus } from "@prisma/client";
import { getConfidenceScore } from "@/db/connector-review";
import { cn } from "@/lib/cn";

export function ReviewStatusBadge({ status }: { status: ConnectorReviewStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        status === "PENDING" && "border-accent/30 bg-accent/10 text-accent",
        status === "APPROVED" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        status === "REJECTED" && "border-red-500/30 bg-red-500/10 text-red-400",
        status === "SUPERSEDED" && "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
      )}
    >
      {status}
    </span>
  );
}

export function ActionBadge({ action }: { action: ConnectorReviewAction }) {
  return (
    <span className="inline-flex rounded-sm border border-border bg-surface-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
      {action.replaceAll("_", " ")}
    </span>
  );
}

export function ConfidenceValue({ value }: { value: unknown }) {
  const score = getConfidenceScore(value);
  return (
    <span className="font-mono text-xs">
      {score === null ? "n/a" : `${Math.round(score * 100)}%`}
    </span>
  );
}
