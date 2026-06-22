import type { Metadata } from "next";
import { ImportStatusBadge } from "@/components/admin/import-status-badge";
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
    <div className="grid gap-8">
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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
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
                  <td className="px-5 py-4">
                    {run.finishedAt ? formatDate(run.finishedAt) : "Pending"}
                  </td>
                  <td className="px-5 py-4">{run.recordsFound}</td>
                  <td className="px-5 py-4">{run.recordsCreated}</td>
                  <td className="px-5 py-4">{run.recordsUpdated}</td>
                  <td className="px-5 py-4">{run.recordsSkipped}</td>
                  <td className="px-5 py-4">
                    {run.status === "FAILED" ? formatOptional(run.errorMessage) : "No"}
                  </td>
                  <td className="px-5 py-4">
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
