import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Pause, Play, RotateCcw } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ChangeDiffCard } from "@/components/admin/change-diff-card";
import { ImportStatusBadge } from "@/components/admin/import-status-badge";
import { SourceBadge } from "@/components/admin/source-badge";
import { Card } from "@/components/ui/card";
import { getConnectorJobAdminData } from "@/db/connectors";
import { getAutomationJob } from "@/jobs/automation/registry";
import type { EventsImportPreview } from "@/jobs/connectors/events/types";
import type { YouTubeImportPreview } from "@/jobs/connectors/youtube/types";
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
  const data = await getConnectorJobAdminData(id);

  if (!job || !data) {
    notFound();
  }

  const lastRun = data.importRuns[0];
  const sourceUrl = data.source?.baseUrl ?? data.preview.sourceUrl;

  return (
    <div className="grid gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Job Detail
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">{job.name}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            {data.kind === "events"
              ? "Calendar-only connector foundation for event metadata. It must not import race results, stage timing, points, standings, records, or statistics."
              : "Safe connector foundation for video metadata. This job can prepare media review items but must not change results, standings, points, or records."}
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
            <ConfigRow label="Source" value={data.source?.name ?? "Source pending"} />
            <ConfigRow label="Source URL" value={sourceUrl} />
            <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface-muted p-3">
              <span className="text-foreground/[0.58]">Reliability</span>
              <SourceBadge reliability={data.source?.reliability ?? "OFFICIAL"} />
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

      {data.kind === "youtube" ? <YouTubePreview preview={data.preview} /> : null}
      {data.kind === "events" ? <EventsPreview preview={data.preview} /> : null}

      <ChangeDiffCard
        title="Diff preview placeholder"
        previous={data.preview.diffs[0]?.previous}
        next={data.preview.diffs[0]?.next}
      />
    </div>
  );
}

function YouTubePreview({ preview }: { preview: YouTubeImportPreview }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-5">
        <h2 className="text-xl font-black">Sample fetched videos</h2>
        <p className="mt-2 text-sm text-foreground/[0.62]">
          Demo fetcher output. No real YouTube API request is made.
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
  );
}

function EventsPreview({ preview }: { preview: EventsImportPreview }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-5">
        <h2 className="text-xl font-black">Sample fetched events</h2>
        <p className="mt-2 text-sm text-foreground/[0.62]">
          Demo calendar output only. No official website is fetched in Step 18.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
            <tr>
              {[
                "Event",
                "Season",
                "Date",
                "Country",
                "Location",
                "Status",
                "Official URL",
                "Would create/update",
              ].map((heading) => (
                <th key={heading} className="px-5 py-4 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.normalizedEvents.map((event) => (
              <tr key={event.externalId} className="border-t border-border">
                <td className="px-5 py-4 font-semibold">{event.name}</td>
                <td className="px-5 py-4">{event.seasonYear}</td>
                <td className="px-5 py-4">{formatDate(event.startDate)}</td>
                <td className="px-5 py-4">
                  {event.countryName} ({event.countryCode})
                </td>
                <td className="px-5 py-4">
                  {[event.city, event.venue].filter(Boolean).join(" / ")}
                </td>
                <td className="px-5 py-4">{event.status}</td>
                <td className="px-5 py-4 text-foreground/[0.62]">{event.officialUrl}</td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 text-accent">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Pending Event review
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
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
