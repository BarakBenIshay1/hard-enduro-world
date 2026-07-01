import { Card } from "@/components/ui/card";

export function VerificationCoverageCard({
  coverage,
}: {
  coverage: { verified: number; total: number; percentage: number };
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Verified coverage
      </p>
      <p className="mt-3 text-4xl font-black">{coverage.percentage}%</p>
      <p className="mt-2 text-sm text-foreground/[0.62]">
        {coverage.verified} / {coverage.total} tracked fields verified
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${coverage.percentage}%` }}
        />
      </div>
    </Card>
  );
}
