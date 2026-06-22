import type { Metadata } from "next";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { ImportStatusBadge } from "@/components/admin/import-status-badge";
import { Card } from "@/components/ui/card";
import { getAutomationDashboardData } from "@/db/automation";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Automation",
  description: "Admin automation foundation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminAutomationPage() {
  const { overview, importRuns } = await getAutomationDashboardData();

  return (
    <div className="grid gap-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Automation
        </p>
        <h1 className="mt-2 text-3xl font-black lg:text-5xl">Automation dashboard</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Internal foundation for scheduled jobs, import health, review queues, and future
          automated data collection. No real fetching is implemented yet.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Active Jobs"
          value={overview.activeJobs}
          detail="Enabled in registry"
          icon={PlayCircle}
        />
        <AdminStatCard
          label="Paused Jobs"
          value={overview.pausedJobs}
          detail="Disabled placeholder"
          icon={PauseCircle}
        />
        <AdminStatCard
          label="Failed Jobs"
          value={overview.failedJobs}
          detail="Failed import runs"
          icon={AlertTriangle}
        />
        <AdminStatCard
          label="Successful Runs"
          value={overview.successfulRuns}
          detail="Completed imports"
          icon={CheckCircle2}
        />
        <AdminStatCard
          label="Last Run"
          value={overview.lastRunTime ? formatDate(overview.lastRunTime) : "Pending"}
          detail="Most recent import run"
          icon={Clock}
        />
        <AdminStatCard
          label="Next Scheduled Run"
          value={overview.nextScheduledRun}
          detail="Cron placeholder"
          icon={Clock}
        />
        <AdminStatCard
          label="Health Status"
          value={overview.healthStatus}
          detail="Derived from failed imports"
          icon={Gauge}
        />
        <AdminStatCard
          label="Pending Imports"
          value={overview.pendingImports}
          detail="Review queue candidates"
          icon={AlertTriangle}
        />
      </section>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Recent automation runs</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            ImportRun records power this placeholder history until the runner is
            connected.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
              <tr>
                {[
                  "Job",
                  "Source",
                  "Status",
                  "Started",
                  "Found",
                  "Created",
                  "Updated",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-4 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {importRuns.map((run) => (
                <tr key={run.id} className="border-t border-border">
                  <td className="px-5 py-4 font-semibold">{run.jobName}</td>
                  <td className="px-5 py-4">
                    {run.sourceSnapshot?.dataSource.name ?? "Internal"}
                  </td>
                  <td className="px-5 py-4">
                    <ImportStatusBadge status={run.status} />
                  </td>
                  <td className="px-5 py-4">{formatDate(run.startedAt)}</td>
                  <td className="px-5 py-4">{run.recordsFound}</td>
                  <td className="px-5 py-4">{run.recordsCreated}</td>
                  <td className="px-5 py-4">{run.recordsUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
