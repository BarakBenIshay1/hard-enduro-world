import type { Metadata } from "next";
import {
  Activity,
  Boxes,
  Clock,
  Database,
  GitBranch,
  HardDrive,
  ServerCog,
  ShieldCheck,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import { getSystemAdminData } from "@/db/system";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "System",
  description: "Read-only production deployment foundation status.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminSystemPage() {
  const data = await getSystemAdminData();

  return (
    <div className="grid gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            System
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">
            Deployment readiness foundation
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Read-only operational status for future Vercel, Supabase, and Upstash
            deployment. This page does not deploy, mutate data, or expose secrets.
          </p>
        </div>
        <AdminStatusBadge status="placeholder" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Readiness Score"
          value={`${data.readiness.score}%`}
          detail={data.readiness.summary}
          icon={Activity}
        />
        <AdminStatCard
          label="Environment"
          value={data.environment}
          detail={`Node mode: ${data.nodeEnv}`}
          icon={ServerCog}
        />
        <AdminStatCard
          label="Database"
          value={data.databaseStatus}
          detail="Connectivity placeholder"
          icon={Database}
        />
        <AdminStatCard
          label="Redis"
          value={data.redisStatus}
          detail="Upstash/Docker placeholder"
          icon={HardDrive}
        />
        <AdminStatCard
          label="App Version"
          value={data.appVersion}
          detail="Template value only"
          icon={GitBranch}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Sources"
          value={data.sourceCount}
          detail="Tracked data sources"
          icon={Boxes}
        />
        <AdminStatCard
          label="Pending Reviews"
          value={data.pendingReviews}
          detail="Imports awaiting review"
          icon={ShieldCheck}
        />
        <AdminStatCard
          label="Automation Jobs"
          value={`${data.enabledAutomationJobs}/${data.automationJobs}`}
          detail="Enabled / registered"
          icon={Activity}
        />
        <AdminStatCard
          label="Audit Entries"
          value={data.dataVersionCount}
          detail="Version history rows"
          icon={Clock}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <h2 className="text-xl font-black">Production blockers</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            Preview-only detection for missing requirements before a future cloud
            deployment.
          </p>
          <div className="mt-5 grid gap-3">
            {data.readiness.blockers.length > 0 ? (
              data.readiness.blockers.map((blocker) => (
                <StatusRow
                  key={blocker.id}
                  label={blocker.label}
                  value={blocker.detail}
                />
              ))
            ) : (
              <StatusRow label="Blockers" value="No required blockers detected" />
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black">Readiness checks</h2>
          <div className="mt-5 grid gap-3">
            {data.readiness.checks.map((check) => (
              <div
                key={check.id}
                className="grid gap-3 rounded-md border border-border bg-surface-muted p-3 text-sm sm:grid-cols-[180px_110px_1fr]"
              >
                <span className="font-semibold">{check.label}</span>
                <span className="uppercase tracking-[0.14em] text-accent">
                  {check.status}
                </span>
                <span className="text-foreground/[0.62]">{check.detail}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-black">Latest import run</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <StatusRow label="Job" value={data.latestImportRun?.jobName ?? "None"} />
            <StatusRow label="Status" value={data.latestImportRun?.status ?? "Pending"} />
            <StatusRow
              label="Started"
              value={
                data.latestImportRun
                  ? formatDate(data.latestImportRun.startedAt)
                  : "No import runs"
              }
            />
            <StatusRow
              label="Source"
              value={
                data.latestImportRun?.sourceSnapshot?.dataSource.name ??
                "Source placeholder"
              }
            />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black">Deployment placeholders</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <StatusRow label="Build" value={data.buildStatus} />
            <StatusRow label="Deployment" value={data.deploymentStatus} />
            <StatusRow
              label="Latest calculation"
              value={
                data.latestCalculationRun
                  ? formatDate(data.latestCalculationRun.startedAt)
                  : "Preview-only, no run yet"
              }
            />
            <StatusRow label="Admin protection" value="Future Supabase Auth step" />
          </div>
        </Card>
      </section>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface-muted p-3">
      <span className="text-foreground/[0.58]">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
