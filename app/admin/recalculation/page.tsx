import type { Metadata } from "next";
import { AlertTriangle, BarChart3, Clock, Database, FileCheck2 } from "lucide-react";
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
import { getRecalculationAdminData } from "@/db/recalculation";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recalculation",
  description: "Preview-only statistics and records recalculation foundation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminRecalculationPage() {
  const data = await getRecalculationAdminData();
  const topRiders = data.statisticsPreview.riderStats.slice(0, 8);
  const recordRows = data.recordsPreview.records.slice(0, 11);

  return (
    <div className="grid min-w-0 gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Recalculation
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">
            Statistics and records preview
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Preview-only engines for recalculating championship statistics and records
            from approved-result-style data. These previews do not write to public tables
            and require review before any future publish action.
          </p>
        </div>
        <AdminStatusBadge status="review" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          label="Last Run"
          value={data.latestRun ? formatDate(data.latestRun.startedAt) : "None"}
          detail="No publish action yet"
          icon={Clock}
        />
        <AdminStatCard
          label="Pending Items"
          value={data.pendingRecalculationItems}
          detail="Awaiting future review"
          icon={FileCheck2}
        />
        <AdminStatCard
          label="Result Rows"
          value={data.resultRowsCount}
          detail="Preview input rows"
          icon={Database}
        />
        <AdminStatCard
          label="Validation"
          value={data.validationIssues.length}
          detail="Warnings and checks"
          icon={AlertTriangle}
        />
        <AdminStatCard
          label="Would Change"
          value={data.wouldChange.recordPreviews}
          detail="Record preview outputs"
          icon={BarChart3}
        />
      </section>

      <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className={adminTableCardClass}>
          <div className="border-b border-border p-5">
            <h2 className="text-xl font-black">Statistics recalculation preview</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
              Rider wins, podiums, starts, DNFs, finish rate, and average finish position
              calculated in memory only.
            </p>
          </div>
          <div className={adminTableScrollClass}>
            <table className={adminCompactTableClass}>
              <thead className={adminTableHeadClass}>
                <tr>
                  {[
                    "Rider",
                    "Wins",
                    "Podiums",
                    "Starts",
                    "DNFs",
                    "Finish Rate",
                    "Avg Finish",
                  ].map((heading) => (
                    <th key={heading} className={adminTableHeaderCellClass}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topRiders.map((row) => (
                  <tr key={row.riderId} className="border-t border-border">
                    <td className={adminTablePrimaryCellClass}>
                      <span className="font-semibold">{row.riderName}</span>
                    </td>
                    <td className={adminTableCellClass}>{row.wins}</td>
                    <td className={adminTableCellClass}>{row.podiums}</td>
                    <td className={adminTableCellClass}>{row.starts}</td>
                    <td className={adminTableCellClass}>{row.dnfs}</td>
                    <td className={adminTableCellClass}>
                      {Math.round(row.finishRate * 100)}%
                    </td>
                    <td className={adminTableCellClass}>
                      {row.averageFinishPosition ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black">Validation warnings</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            Prepared checks for missing result rows, duplicated results, invalid podiums,
            missing entity links, and inconsistent DNF/DNS statuses.
          </p>
          <div className="mt-5 grid gap-3">
            {data.validationIssues.length > 0 ? (
              data.validationIssues.slice(0, 8).map((issue) => (
                <div
                  key={`${issue.code}-${issue.message}`}
                  className="rounded-md border border-border bg-surface-muted p-4"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-accent">
                    {issue.severity} / {issue.code}
                  </p>
                  <p className="mt-2 text-sm text-foreground/[0.68]">{issue.message}</p>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-border bg-surface-muted p-4 text-sm text-foreground/[0.62]">
                No validation warnings in the current demo preview.
              </div>
            )}
          </div>
        </Card>
      </section>

      <Card className={adminTableCardClass}>
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Records recalculation preview</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            Shows what records would be proposed for review. No `ChampionshipRecord` rows
            are created or updated in Step 21.
          </p>
        </div>
        <div className={adminTableScrollClass}>
          <table className={adminCompactTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                {["Record", "Holder", "Value", "Status", "Review"].map((heading) => (
                  <th key={heading} className={adminTableHeaderCellClass}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recordRows.map((record) => (
                <tr key={record.key} className="border-t border-border">
                  <td className={adminTablePrimaryCellClass}>
                    <span className="font-semibold">{record.title}</span>
                  </td>
                  <td className={adminTableCellClass}>{record.holder}</td>
                  <td className={adminTableCellClass}>{record.value}</td>
                  <td className={adminTableCellClass}>
                    <AdminStatusBadge
                      status={record.placeholder ? "placeholder" : "review"}
                    />
                  </td>
                  <td className={adminTableMutedCellClass}>
                    Review required before publish
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
