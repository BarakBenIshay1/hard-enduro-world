import { cn } from "@/lib/cn";

type AdminStatusBadgeProps = {
  status: "ready" | "placeholder" | "locked" | "review";
};

export function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
  const labels = {
    ready: "Ready",
    placeholder: "Placeholder",
    locked: "Auth Pending",
    review: "Review Queue",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        status === "ready" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        status === "placeholder" && "border-accent/30 bg-accent/10 text-accent",
        status === "locked" && "border-gold/30 bg-gold/10 text-gold",
        status === "review" && "border-red-500/30 bg-red-500/10 text-red-400",
      )}
    >
      {labels[status]}
    </span>
  );
}
