import { Activity, Flag, Medal, ShieldAlert, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";

export type RiderStat = {
  label: string;
  value: number;
};

export function RiderStatsCards({ stats }: { stats: RiderStat[] }) {
  const hasVerifiedStats = stats.some((stat) => stat.value > 0);

  return (
    <section>
      <SectionTitle
        eyebrow="Quick Facts"
        title="Career record at a glance"
        description="Verified totals are shown when available. Missing records stay compact until confirmed."
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <StatIcon label={stat.label} />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
              {stat.label}
            </p>
            {stat.value > 0 ? (
              <p className="mt-2 text-2xl font-black">{stat.value}</p>
            ) : (
              <p className="mt-2 text-xs font-semibold leading-5 text-foreground/[0.58]">
                Coming soon
              </p>
            )}
          </Card>
        ))}
      </div>
      {!hasVerifiedStats ? (
        <p className="mt-4 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm font-semibold text-foreground/[0.62]">
          Verified data coming soon.
        </p>
      ) : null}
    </section>
  );
}

function StatIcon({ label }: { label: string }) {
  const Icon =
    label === "Wins"
      ? Trophy
      : label === "Podiums" || label === "Titles"
        ? Medal
        : label === "DNF"
          ? ShieldAlert
          : label === "Starts" || label === "Finishes"
            ? Flag
            : Activity;

  return <Icon className="h-5 w-5 text-accent" aria-hidden="true" />;
}
