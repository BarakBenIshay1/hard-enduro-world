import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { ChangeDiffCard } from "@/components/admin/change-diff-card";
import { ImportStatusBadge } from "@/components/admin/import-status-badge";
import { Card } from "@/components/ui/card";
import { getImportReviewData } from "@/db/sources";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Import Review",
  description: "Admin import review queue foundation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminReviewPage() {
  const { importRuns } = await getImportReviewData();
  const pending = importRuns.filter((run) => run.status === "PENDING");
  const needsReview = importRuns.filter((run) => run.status === "NEEDS_REVIEW");
  const approved = importRuns.filter((run) => run.status === "COMPLETED");
  const failed = importRuns.filter((run) => run.status === "FAILED");
  const latestChange = importRuns.flatMap((run) => run.changes)[0];

  return (
    <div className="grid gap-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Import Review
        </p>
        <h1 className="mt-2 text-3xl font-black lg:text-5xl">Review queue</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Review parsed changes before approval. Buttons are placeholders only; no real
          approval or rejection logic is implemented in Step 15.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <QueueCard label="Pending imports" value={pending.length} />
        <QueueCard label="Needs review" value={needsReview.length} />
        <QueueCard label="Approved" value={approved.length} />
        <QueueCard label="Rejected" value={0} />
        <QueueCard label="Failed" value={failed.length} />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Pending import runs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
              <tr>
                {[
                  "Job",
                  "Source",
                  "Status",
                  "Found",
                  "Created",
                  "Updated",
                  "Started",
                  "Actions",
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
                    {run.sourceSnapshot?.dataSource.name ?? "Manual"}
                  </td>
                  <td className="px-5 py-4">
                    <ImportStatusBadge status={run.status} />
                  </td>
                  <td className="px-5 py-4">{run.recordsFound}</td>
                  <td className="px-5 py-4">{run.recordsCreated}</td>
                  <td className="px-5 py-4">{run.recordsUpdated}</td>
                  <td className="px-5 py-4">{formatDate(run.startedAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-400 opacity-70"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-400 opacity-70"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ChangeDiffCard
        title="Diff preview placeholder"
        previous={latestChange?.previous}
        next={latestChange?.next}
      />
    </div>
  );
}

function QueueCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-accent">{value}</p>
    </Card>
  );
}
