import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, ClipboardList, Rocket } from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import { getDeploymentReadinessData } from "@/db/deployment";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deployment",
  description: "Deployment preview and production readiness report.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminDeploymentPage() {
  const data = await getDeploymentReadinessData();

  return (
    <div className="grid gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Deployment
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">
            Production readiness report
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Read-only deployment preview for future Vercel, Supabase, and Upstash launch.
            This page performs no deployment and makes no external calls.
          </p>
        </div>
        <AdminStatusBadge status="review" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Readiness"
          value={`${data.report.score}%`}
          detail={data.report.summary}
          icon={Rocket}
        />
        <AdminStatCard
          label="Status"
          value={data.report.status}
          detail={data.currentDeploymentStatus}
          icon={ClipboardList}
        />
        <AdminStatCard
          label="Blockers"
          value={data.report.blockers.length}
          detail="Required before launch"
          icon={AlertTriangle}
        />
        <AdminStatCard
          label="Sources"
          value={data.sourceCount}
          detail="Tracked source records"
          icon={CheckCircle2}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChecklistCard title="Environment variables" items={data.envChecklist} />
        <ChecklistCard title="Required services" items={data.servicesChecklist} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <h2 className="text-xl font-black">Current deployment status</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <ReportRow label="Environment" value={data.appEnvironment} />
            <ReportRow label="Build" value={data.buildStatus} />
            <ReportRow
              label="Latest import"
              value={
                data.latestImportRun
                  ? `${data.latestImportRun.jobName} / ${formatDate(data.latestImportRun.startedAt)}`
                  : "No import runs"
              }
            />
            <ReportRow label="Pending reviews" value={String(data.pendingReviews)} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black">Production blockers</h2>
          <div className="mt-5 grid gap-3">
            {data.report.blockers.map((blocker) => (
              <div
                key={blocker.id}
                className="rounded-md border border-border bg-surface-muted p-4"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-accent">
                  {blocker.status}
                </p>
                <p className="mt-2 font-semibold">{blocker.label}</p>
                <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
                  {blocker.detail}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function ChecklistCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; configured: boolean; required: boolean }>;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-5">
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <div
            key={item.label}
            className="grid gap-3 p-5 text-sm sm:grid-cols-[1fr_120px_120px]"
          >
            <span className="font-semibold">{item.label}</span>
            <span>{item.configured ? "Configured" : "Missing"}</span>
            <span className="text-foreground/[0.62]">
              {item.required ? "Required" : "Optional"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface-muted p-3">
      <span className="text-foreground/[0.58]">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
