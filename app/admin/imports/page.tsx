import type { Metadata } from "next";
import { ImportStatusBadge } from "@/components/admin/import-status-badge";
import {
  adminTableCardClass,
  adminTableCellClass,
  adminTableHeadClass,
  adminTableHeaderCellClass,
  adminTableMutedCellClass,
  adminTablePrimaryCellClass,
  adminTableScrollClass,
  adminWideTableClass,
} from "@/components/admin/admin-table-styles";
import { Card } from "@/components/ui/card";
import { getAutomationImportsData } from "@/db/automation";
import { formatDate, formatOptional } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Imports",
  description: "Automation import run history foundation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminImportsPage() {
  const { importRuns } = await getAutomationImportsData();

  return (
    <div className="grid min-w-0 gap-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Imports
        </p>
        <h1 className="mt-2 text-3xl font-black lg:text-5xl">Import run history</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Historical ImportRun rows for future automation jobs, parsers, review status,
          and audit log linking.
        </p>
      </section>

      <Card className={adminTableCardClass}>
        <div className={adminTableScrollClass}>
          <table className={adminWideTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                {[
                  "Job name",
                  "Source",
                  "Status",
                  "Started",
                  "Finished",
                  "Found",
                  "Created",
                  "Updated",
                  "Skipped",
                  "Failed",
                  "Review status",
                ].map((heading) => (
                  <th key={heading} className={adminTableHeaderCellClass}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {importRuns.map((run) => (
                <tr key={run.id} className="border-t border-border">
                  <td className={adminTablePrimaryCellClass}>
                    <span className="font-semibold">{run.jobName}</span>
                  </td>
                  <td className={adminTableCellClass}>
                    {run.sourceSnapshot?.dataSource.name ?? "Internal"}
                  </td>
                  <td className={adminTableCellClass}>
                    <ImportStatusBadge status={run.status} />
                  </td>
                  <td className={adminTableCellClass}>{formatDate(run.startedAt)}</td>
                  <td className={adminTableCellClass}>
                    {run.finishedAt ? formatDate(run.finishedAt) : "Pending"}
                  </td>
                  <td className={adminTableCellClass}>{run.recordsFound}</td>
                  <td className={adminTableCellClass}>{run.recordsCreated}</td>
                  <td className={adminTableCellClass}>{run.recordsUpdated}</td>
                  <td className={adminTableCellClass}>{run.recordsSkipped}</td>
                  <td className={adminTableMutedCellClass}>
                    {run.status === "FAILED" ? formatOptional(run.errorMessage) : "No"}
                  </td>
                  <td className={adminTableCellClass}>
                    {run.status === "NEEDS_REVIEW" || run.status === "PENDING"
                      ? "Needs review"
                      : "Resolved"}
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
