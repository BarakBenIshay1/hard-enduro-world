import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Pause, Play, RotateCcw } from "lucide-react";
import { ChangeDiffCard } from "@/components/admin/change-diff-card";
import { ImportStatusBadge } from "@/components/admin/import-status-badge";
import { SourceBadge } from "@/components/admin/source-badge";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import { getYouTubeJobAdminData } from "@/db/videos";
import { getAutomationJob } from "@/jobs/automation/registry";
import { formatDate } from "@/lib/format";

type AdminJobDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: AdminJobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const job = getAutomationJob(id);

  return {
    title: job?.name ?? "Job",
    description: job?.description ?? "Automation job detail.",
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default async function AdminJobDetailPage({ params }: AdminJobDetailPageProps) {
  const { id } = await params;
  const job = getAutomationJob(id);

  if (!job || id !== "youtube-videos") {
    notFound();
  }

  const { preview, importRuns, source } = await getYouTubeJobAdminData();
  const lastRun = importRuns[0];

  return (
    <div className="grid gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Job Detail
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">{job.name}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Safe connector foundation for video metadata. This job can prepare media
            review items but must not change results, standings, points, or records.
          </p>
        </div>
        <AdminStatusBadge status={job.enabled ? "ready" : "locked"} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-6">
          <h2 className="text-xl font-black">Job configuration</h2>
          <div className="mt-6 grid gap-3 text-sm">
            <ConfigRow label="Job ID" value={job.id} />
            <ConfigRow label="Source type" value={job.sourceType} />
            <ConfigRow label="Frequency" value={job.frequency} />
            <ConfigRow label="Risk level" value={job.riskLevel} />
            <ConfigRow
              label="Review required"
              value={job.reviewRequired ? "Yes" : "No"}
            />
            <ConfigRow label="Connector" value={job.connectorPath ?? "Not configured"} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <ActionButton icon={Play} label="Run now" />
            <ActionButton icon={Pause} label="Pause" />
            <ActionButton icon={RotateCcw} label="Resume" />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black">Source tracking</h2>
          <div className="mt-6 grid gap-3 text-sm">
            <ConfigRow label="Source" value={source?.name ?? "YouTube source pending"} />
            <ConfigRow label="Source URL" value={source?.baseUrl ?? preview.sourceUrl} />
            <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface-muted p-3">
              <span className="text-foreground/[0.58]">Reliability</span>
              <SourceBadge reliability={source?.reliability ?? "TRUSTED"} />
            </div>
            <ConfigRow
              label="Last run"
              value={lastRun ? formatDate(lastRun.startedAt) : "Placeholder only"}
            />
            <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface-muted p-3">
              <span className="text-foreground/[0.58]">Last result</span>
              <ImportStatusBadge status={lastRun?.status ?? "PENDING"} />
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Sample fetched videos</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            Demo fetcher output. No real YouTube API request is made in Step 17.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
              <tr>
                {["Title", "Channel", "Published", "Provider ID", "Would create"].map(
                  (heading) => (
                    <th key={heading} className="px-5 py-4 font-semibold">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {preview.normalizedVideos.map((video) => (
                <tr key={video.providerId} className="border-t border-border">
                  <td className="px-5 py-4 font-semibold">{video.title}</td>
                  <td className="px-5 py-4">{video.channelTitle}</td>
                  <td className="px-5 py-4">{formatDate(video.publishedAt)}</td>
                  <td className="px-5 py-4 font-mono text-xs">{video.providerId}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 text-accent">
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Pending MediaItem review
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ChangeDiffCard
        title="Diff preview placeholder"
        previous={preview.diffs[0]?.previous}
        next={preview.diffs[0]?.next}
      />
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface-muted p-3">
      <span className="text-foreground/[0.58]">{label}</span>
      <span className="font-semibold">{value}</span>
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
