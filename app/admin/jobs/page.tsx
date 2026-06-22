import type { Metadata } from "next";
import { Pause, Play, RotateCcw, ScrollText } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import { getAutomationDashboardData } from "@/db/automation";
import { automationJobRegistry } from "@/jobs/automation/registry";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Automation job registry foundation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminJobsPage() {
  const { importRuns } = await getAutomationDashboardData();

  return (
    <div className="grid gap-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Jobs
        </p>
        <h1 className="mt-2 text-3xl font-black lg:text-5xl">Automation job registry</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Future scheduled jobs are typed and registered here. Actions are disabled
          placeholders until real runners and auth are approved.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {automationJobRegistry.map((job) => {
          const lastRun = importRuns.find((run) => run.jobName.includes(job.id));

          return (
            <Card key={job.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-foreground/[0.48]">
                    {job.sourceType} • {job.frequency}
                  </p>
                  <h2 className="mt-2 text-2xl font-black">{job.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-foreground/[0.62]">
                    {job.description}
                  </p>
                </div>
                <AdminStatusBadge status={job.enabled ? "ready" : "locked"} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MiniField label="Risk" value={job.riskLevel} />
                <MiniField
                  label="Review required"
                  value={job.reviewRequired ? "Yes" : "No"}
                />
                <MiniField
                  label="Last run"
                  value={lastRun ? formatDate(lastRun.startedAt) : "Pending"}
                />
                <MiniField label="Last result" value={lastRun?.status ?? "No run"} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <ActionButton icon={Play} label="Run now" />
                <ActionButton icon={Pause} label="Pause" />
                <ActionButton icon={RotateCcw} label="Resume" />
                <ActionButton icon={ScrollText} label="View logs" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-muted p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label }: { icon: typeof Play; label: string }) {
  return (
    <button
      type="button"
      disabled
      className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface-muted px-3 text-xs font-semibold opacity-70"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
