import type { Metadata } from "next";
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  ListChecks,
  LockKeyhole,
  Route,
  ShieldCheck,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import {
  adminCompactTableClass,
  adminTableCardClass,
  adminTableCellClass,
  adminTableHeadClass,
  adminTableHeaderCellClass,
  adminTableMutedCellClass,
  adminTablePrimaryCellClass,
  adminTableScrollClass,
} from "@/components/admin/admin-table-styles";
import { Card } from "@/components/ui/card";
import { getPreflightAuditData } from "@/db/preflight";
import { cn } from "@/lib/cn";
import type { PreflightStatus } from "@/lib/preflight/safety-audit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preflight",
  description: "Pre-deployment audit and QA checks.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminPreflightPage() {
  const data = await getPreflightAuditData();

  return (
    <div className="grid min-w-0 gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Preflight
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">
            Pre-deployment audit and QA
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Read-only checks before the first Vercel preview deployment. This page does
            not deploy, call external services, publish imported data, or expose secrets.
          </p>
        </div>
        <AdminStatusBadge status={data.previewSafe ? "ready" : "review"} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Preview Safe"
          value={data.previewSafe ? "Yes" : "No"}
          detail="Required preview checks"
          icon={CheckCircle2}
        />
        <AdminStatCard
          label="Production Blockers"
          value={data.reviewChecks.length}
          detail="Need final setup before launch"
          icon={AlertTriangle}
        />
        <AdminStatCard
          label="Routes Audited"
          value={data.routeSummary.total}
          detail={`${data.routeSummary.adminProtectedRoutes} admin protected`}
          icon={Route}
        />
        <AdminStatCard
          label="Safety Rules"
          value={data.safetyAuditItems.length}
          detail="Review-first guarantees"
          icon={ShieldCheck}
        />
      </section>

      <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-5">
            <h2 className="text-xl font-black">Pre-deployment checks</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
              Preview-safe checks must pass before the first deployment. Production-only
              items can remain in review for now.
            </p>
          </div>
          <div className="divide-y divide-border">
            {data.checks.map((check) => (
              <div
                key={check.id}
                className="grid min-w-0 gap-3 p-5 text-sm lg:grid-cols-[minmax(0,190px)_110px_minmax(0,1fr)_130px]"
              >
                <span className="font-semibold">{check.label}</span>
                <PreflightBadge status={check.status} />
                <span className="text-foreground/[0.62]">{check.detail}</span>
                <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.48]">
                  {check.requiredForProduction ? "Production" : "Preview"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <FileSearch className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="mt-5 text-xl font-black">Production blockers</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            These are expected before the first real production launch. They do not block
            a safe preview deployment.
          </p>
          <div className="mt-5 grid gap-3">
            {data.reviewChecks.map((check) => (
              <div
                key={check.id}
                className="rounded-md border border-border bg-surface-muted p-4"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-accent">
                  {check.status}
                </p>
                <p className="mt-2 font-semibold">{check.label}</p>
                <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
                  {check.detail}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-5">
            <h2 className="text-xl font-black">Safety audit</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
              Connector and calculation workflows remain review-first and preview-only.
            </p>
          </div>
          <div className="divide-y divide-border">
            {data.safetyAuditItems.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 p-5 text-sm sm:grid-cols-[1fr_90px]"
              >
                <div>
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-2 leading-6 text-foreground/[0.62]">{item.evidence}</p>
                </div>
                <PreflightBadge status={item.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <LockKeyhole className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="mt-5 text-xl font-black">Route audit summary</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <SummaryRow label="Public routes" value={data.routeSummary.publicRoutes} />
            <SummaryRow
              label="Admin protected"
              value={data.routeSummary.adminProtectedRoutes}
            />
            <SummaryRow
              label="SEO indexable"
              value={data.routeSummary.seoIndexableRoutes}
            />
            <SummaryRow label="No-index" value={data.routeSummary.noIndexRoutes} />
            <SummaryRow label="Dynamic routes" value={data.routeSummary.dynamicRoutes} />
          </div>
        </Card>
      </section>

      <Card className={adminTableCardClass}>
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <ListChecks className="h-5 w-5 text-accent" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-black">Route inventory</h2>
              <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
                Typed inventory showing public exposure, admin protection, and SEO status.
              </p>
            </div>
          </div>
        </div>
        <div className={adminTableScrollClass}>
          <table className={adminCompactTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                {["Route", "Kind", "Exposure", "SEO", "Notes"].map((heading) => (
                  <th key={heading} className={adminTableHeaderCellClass}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.routeInventory.map((route) => (
                <tr
                  key={`${route.path}-${route.label}`}
                  className="border-t border-border"
                >
                  <td className={adminTablePrimaryCellClass}>
                    <p className="font-semibold">{route.label}</p>
                    <p className="mt-1 font-mono text-xs text-foreground/[0.58]">
                      {route.path}
                    </p>
                  </td>
                  <td className={adminTableCellClass}>{route.kind}</td>
                  <td className={adminTableCellClass}>{route.exposure}</td>
                  <td className={adminTableCellClass}>{route.seoStatus}</td>
                  <td className={adminTableMutedCellClass}>{route.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PreflightBadge({ status }: { status: PreflightStatus }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        status === "pass" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        status === "review" && "border-gold/30 bg-gold/10 text-gold",
        status === "blocked" && "border-red-500/30 bg-red-500/10 text-red-400",
      )}
    >
      {status}
    </span>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface-muted p-3">
      <span className="text-foreground/[0.58]">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
