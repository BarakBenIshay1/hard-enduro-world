import type { Metadata } from "next";
import { ChangeDiffCard } from "@/components/admin/change-diff-card";
import { ImportStatusBadge } from "@/components/admin/import-status-badge";
import { SourceBadge } from "@/components/admin/source-badge";
import { VersionTimeline } from "@/components/admin/version-timeline";
import { Card } from "@/components/ui/card";
import { getSourceDetail } from "@/db/sources";
import { formatDate } from "@/lib/format";

type AdminSourceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: AdminSourceDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const source = await getSourceDetail(id);

  return {
    title: source.name,
    description: `Admin source detail for ${source.name}.`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default async function AdminSourceDetailPage({
  params,
}: AdminSourceDetailPageProps) {
  const { id } = await params;
  const source = await getSourceDetail(id);
  const latestSnapshot = source.snapshots[0];
  const importRuns = source.snapshots.flatMap((snapshot) => snapshot.importRuns);
  const changes = importRuns.flatMap((run) => run.changes);

  return (
    <div className="grid gap-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Source Detail
        </p>
        <h1 className="mt-2 text-3xl font-black lg:text-5xl">{source.name}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Source metadata, linked entities, fetch history, raw snapshots, import runs, and
          future parser confidence live here.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-6">
          <h2 className="text-xl font-black">Source metadata</h2>
          <div className="mt-6 grid gap-4 text-sm">
            <p>
              <span className="text-foreground/[0.48]">Type:</span> {source.type}
            </p>
            <p>
              <span className="text-foreground/[0.48]">URL:</span>{" "}
              {source.baseUrl ?? "Manual source"}
            </p>
            <p>
              <span className="text-foreground/[0.48]">Reliability:</span>{" "}
              <SourceBadge reliability={source.reliability} />
            </p>
            <p>
              <span className="text-foreground/[0.48]">Created:</span>{" "}
              {formatDate(source.createdAt)}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black">Linked entities placeholder</h2>
          <div className="mt-6 grid gap-3">
            {source.links.length > 0 ? (
              source.links.map((link) => (
                <div
                  key={link.id}
                  className="rounded-md border border-border bg-surface-muted p-4"
                >
                  <p className="font-semibold">
                    {link.entityType} / {link.entityId}
                  </p>
                  <p className="mt-2 text-sm text-foreground/[0.58]">{link.url}</p>
                  {link.note ? (
                    <p className="mt-2 text-xs text-foreground/[0.48]">{link.note}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-foreground/[0.58]">
                Entity linking is ready for future automation imports.
              </p>
            )}
          </div>
        </Card>
      </div>

      <VersionTimeline
        items={importRuns.map((run) => ({
          id: run.id,
          title: run.jobName,
          description: `${run.recordsFound} found, ${run.recordsCreated} created, ${run.recordsUpdated} updated, ${run.recordsSkipped} skipped`,
          action: run.status,
          status: run.status,
          createdAt: run.startedAt,
        }))}
      />

      <Card className="p-6">
        <h2 className="text-xl font-black">Fetch history placeholder</h2>
        <div className="mt-6 grid gap-3">
          {source.snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="grid gap-3 rounded-md border border-border bg-surface-muted p-4 md:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="font-semibold">{snapshot.url}</p>
                <p className="mt-1 text-sm text-foreground/[0.58]">
                  Hash: {snapshot.contentHash} • Status: {snapshot.statusCode ?? "n/a"}
                </p>
              </div>
              <p className="font-mono text-sm text-accent">
                {formatDate(snapshot.fetchedAt)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <ChangeDiffCard
        title="Raw snapshot placeholder"
        previous={{ message: "Previous snapshot comparison pending" }}
        next={latestSnapshot?.rawContent ? { rawContent: latestSnapshot.rawContent } : {}}
      />

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Import run history placeholder</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
              <tr>
                {["Job", "Status", "Found", "Created", "Updated", "Skipped"].map(
                  (heading) => (
                    <th key={heading} className="px-5 py-4 font-semibold">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {importRuns.map((run) => (
                <tr key={run.id} className="border-t border-border">
                  <td className="px-5 py-4 font-semibold">{run.jobName}</td>
                  <td className="px-5 py-4">
                    <ImportStatusBadge status={run.status} />
                  </td>
                  <td className="px-5 py-4">{run.recordsFound}</td>
                  <td className="px-5 py-4">{run.recordsCreated}</td>
                  <td className="px-5 py-4">{run.recordsUpdated}</td>
                  <td className="px-5 py-4">{run.recordsSkipped}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ChangeDiffCard
        title="Latest change diff placeholder"
        previous={changes[0]?.previous}
        next={changes[0]?.next}
      />
    </div>
  );
}
