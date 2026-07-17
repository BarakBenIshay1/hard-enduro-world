import type { DataOriginStatus } from "@prisma/client";
import type {
  ClassificationResolution,
  ClassificationSummary,
} from "@/lib/data-quality/record-classification";
import { cn } from "@/lib/cn";

type ClassificationBadgeProps = {
  resolution?: ClassificationResolution | null;
  status?: DataOriginStatus | "UNCLASSIFIED" | null;
};

const labels: Record<DataOriginStatus | "UNCLASSIFIED", string> = {
  VERIFIED_OFFICIAL: "Verified Official",
  SOURCE_MANAGED_UNVERIFIED: "Source Managed",
  AUDITED_MANUAL: "Audited Manual",
  MANUAL_PLACEHOLDER: "Manual Placeholder",
  DEMO: "Demo",
  SEED: "Seed",
  VALIDATION: "Validation",
  UNKNOWN: "Unknown",
  CONFLICTING: "Conflicting",
  ARCHIVED_HISTORY: "Archived History",
  UNCLASSIFIED: "Unclassified",
};

export function ClassificationBadge({ resolution, status }: ClassificationBadgeProps) {
  const rawValue = status ?? resolution?.originStatus ?? "UNCLASSIFIED";
  const value = rawValue in labels ? rawValue : "UNCLASSIFIED";

  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
        value === "VERIFIED_OFFICIAL" &&
          "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
        value === "SOURCE_MANAGED_UNVERIFIED" &&
          "border-sky-500/35 bg-sky-500/10 text-sky-300",
        value === "AUDITED_MANUAL" &&
          "border-violet-500/35 bg-violet-500/10 text-violet-300",
        value === "MANUAL_PLACEHOLDER" &&
          "border-yellow-500/35 bg-yellow-500/10 text-yellow-200",
        value === "DEMO" && "border-orange-500/35 bg-orange-500/10 text-orange-300",
        value === "SEED" && "border-lime-500/35 bg-lime-500/10 text-lime-300",
        value === "VALIDATION" && "border-cyan-500/35 bg-cyan-500/10 text-cyan-300",
        value === "UNKNOWN" && "border-red-500/35 bg-red-500/10 text-red-300",
        value === "CONFLICTING" && "border-red-500/50 bg-red-500/15 text-red-200",
        value === "ARCHIVED_HISTORY" && "border-zinc-500/35 bg-zinc-500/10 text-zinc-300",
        value === "UNCLASSIFIED" &&
          "border-border bg-surface-muted text-foreground/[0.56]",
      )}
    >
      {labels[value]}
    </span>
  );
}

export function ClassificationSummaryStrip({
  summary,
}: {
  summary: ClassificationSummary;
}) {
  const items = [
    ["Total", summary.total],
    ["Classified", summary.classified],
    ["Unclassified", summary.unclassified],
    ["Verified", summary.verified],
    ["Manual", summary.manual],
    ["Source Managed", summary.sourceManaged],
    ["Quarantined", summary.quarantined],
  ];

  return (
    <section className="grid gap-3">
      <div>
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-foreground/[0.68]">
          Classification summary
        </h2>
        <p className="mt-1 text-xs text-foreground/[0.52]">
          Counts describe the records currently displayed on this page.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-border bg-surface-muted px-3 py-2"
          >
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-foreground/[0.46]">
              {label}
            </div>
            <div className="mt-1 text-lg font-black">{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
