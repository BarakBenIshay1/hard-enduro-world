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
import type { ResultsImportPreview } from "@/jobs/connectors/results/types";
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
              : data.kind === "results"
                ? "High-risk official results connector foundation. Every proposed timing or classification change requires admin review before public data can change."
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
      {data.kind === "results" ? <ResultsPreview preview={data.preview} /> : null}

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
        <h2 className="text-xl font-black">Fetched videos</h2>
        <p className="mt-2 text-sm text-foreground/[0.62]">
          YouTube Data API v3 integration with safe demo fallback when `YOUTUBE_API_KEY`
          or `YOUTUBE_CHANNEL_ID` is missing. All videos enter review before publishing.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <PreviewMetric label="API status" value={preview.apiStatus} />
          <PreviewMetric label="Channel" value={preview.channelStatus} />
          <PreviewMetric label="Fetched" value={formatDate(preview.fetchedAt)} />
          <PreviewMetric label="Playlists" value={preview.playlists.length} />
          <PreviewMetric label="Pending review" value={preview.reviewItems.length} />
        </div>
        {preview.channel ? (
          <div className="mt-4 rounded-md border border-border bg-surface-muted p-4 text-sm">
            <p className="font-semibold">{preview.channel.title}</p>
            <p className="mt-2 text-foreground/[0.62]">
              Videos: {preview.channel.videoCount ?? "Unknown"} / Uploads playlist:{" "}
              {preview.channel.uploadsPlaylistId ?? "Unknown"}
            </p>
          </div>
        ) : null}
        {preview.errorMessage ? (
          <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {preview.errorMessage}
          </div>
        ) : null}
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-fixed text-left text-[13px] sm:text-sm">
          <thead className="bg-black text-[10px] uppercase tracking-[0.12em] text-white/[0.64] sm:text-xs">
            <tr>
              {[
                "Title",
                "Channel",
                "Published",
                "Video ID",
                "Video URL",
                "Would create",
              ].map((heading) => (
                <th
                  key={heading}
                  className="min-w-0 px-2 py-3 align-bottom leading-5 font-semibold sm:px-3"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.normalizedVideos.map((video) => (
              <tr key={video.providerId} className="border-t border-border">
                <td className="min-w-0 px-2 py-3 align-bottom leading-5 font-semibold sm:px-3">
                  {video.title}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {video.channelTitle}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {formatDate(video.publishedAt)}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top font-mono text-xs leading-6 sm:px-3">
                  {video.providerId}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 text-foreground/[0.66] sm:px-3">
                  {video.watchUrl}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
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
      <div className="border-t border-border p-5">
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-foreground/[0.48]">
          Source tracking preview
        </h3>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
          <ConfigRow
            label="Snapshot"
            value={preview.sourceTracking.sourceSnapshot.status}
          />
          <ConfigRow label="Import run" value={preview.sourceTracking.importRun.status} />
          <ConfigRow
            label="Source links"
            value={String(preview.sourceTracking.sourceLinks.length)}
          />
          <ConfigRow
            label="Data versions"
            value={String(preview.sourceTracking.dataVersions.length)}
          />
        </div>
      </div>
    </Card>
  );
}

function EventsPreview({ preview }: { preview: EventsImportPreview }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-5">
        <h2 className="text-xl font-black">Imported event metadata</h2>
        <p className="mt-2 text-sm text-foreground/[0.62]">
          Official calendar connector output limited to event metadata only. Results,
          timing, standings, records, and statistics are not imported here.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <PreviewMetric label="Connector" value={preview.connectorStatus} />
          <PreviewMetric label="Source" value={preview.sourceStatus} />
          <PreviewMetric label="Fetched" value={formatDate(preview.fetchedAt)} />
          <PreviewMetric label="Events" value={preview.normalizedEvents.length} />
          <PreviewMetric label="Pending review" value={preview.reviewItems.length} />
        </div>
        {preview.errorMessage ? (
          <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {preview.errorMessage}
          </div>
        ) : null}
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-fixed text-left text-[13px] sm:text-sm">
          <thead className="bg-black text-[10px] uppercase tracking-[0.12em] text-white/[0.64] sm:text-xs">
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
                <th
                  key={heading}
                  className="min-w-0 px-2 py-3 align-bottom leading-5 font-semibold sm:px-3"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.normalizedEvents.map((event) => (
              <tr key={event.externalId} className="border-t border-border">
                <td className="min-w-0 px-2 py-3 align-bottom leading-5 font-semibold sm:px-3">
                  {event.name}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {event.seasonYear}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {formatDate(event.startDate)}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {event.countryName} ({event.countryCode})
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {[event.city, event.venue].filter(Boolean).join(" / ")}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {event.status}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 text-foreground/[0.66] sm:px-3">
                  {event.officialUrl}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
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
      <div className="border-t border-border p-5">
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-foreground/[0.48]">
          Source tracking preview
        </h3>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
          <ConfigRow
            label="Snapshot"
            value={preview.sourceTracking.sourceSnapshot.status}
          />
          <ConfigRow label="Import run" value={preview.sourceTracking.importRun.status} />
          <ConfigRow
            label="Source links"
            value={String(preview.sourceTracking.sourceLinks.length)}
          />
          <ConfigRow
            label="Data versions"
            value={String(preview.sourceTracking.dataVersions.length)}
          />
        </div>
      </div>
    </Card>
  );
}

function ResultsPreview({ preview }: { preview: ResultsImportPreview }) {
  const creates = preview.diffs.filter((diff) => diff.action === "create").length;
  const updates = preview.diffs.filter((diff) => diff.action === "update").length;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-5">
        <h2 className="text-xl font-black">Imported result rows</h2>
        <p className="mt-2 text-sm text-foreground/[0.62]">
          Official results connector output is review-only. It must never publish directly
          or update standings, statistics, records, history, riders, teams, manufacturers,
          or motorcycles.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <PreviewMetric label="Connector" value={preview.connectorStatus} />
          <PreviewMetric label="Source" value={preview.sourceStatus} />
          <PreviewMetric label="Payload" value={preview.payloadType} />
          <PreviewMetric label="Fetched" value={formatDate(preview.fetchedAt)} />
          <PreviewMetric label="Would create" value={creates} />
          <PreviewMetric label="Requires review" value={preview.reviewItems.length} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <PreviewMetric label="Would update" value={updates} />
          <PreviewMetric label="Imported rows" value={preview.normalizedResults.length} />
        </div>
        {preview.errorMessage ? (
          <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {preview.errorMessage}
          </div>
        ) : null}
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-fixed text-left text-[13px] sm:text-sm">
          <thead className="bg-black text-[10px] uppercase tracking-[0.12em] text-white/[0.64] sm:text-xs">
            <tr>
              {[
                "Event",
                "Stage",
                "Rider",
                "Country",
                "Team",
                "Manufacturer",
                "Motorcycle",
                "Pos",
                "Time",
                "Leader gap",
                "Prev gap",
                "Penalties",
                "Points",
                "Status",
                "Review action",
              ].map((heading) => (
                <th
                  key={heading}
                  className="min-w-0 px-2 py-3 align-bottom leading-5 font-semibold sm:px-3"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.normalizedResults.map((result) => (
              <tr key={result.externalId} className="border-t border-border">
                <td className="min-w-0 px-2 py-3 align-bottom leading-5 font-semibold sm:px-3">
                  {result.event}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {result.stage}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {result.rider}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {result.country}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {result.team}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {result.manufacturer}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {result.motorcycle}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {result.position ?? "-"}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {result.time ?? "-"}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {result.gapToLeader ?? "-"}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {result.gapToPrevious ?? "-"}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {result.penalties ?? "-"}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {result.points ?? "-"}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  {result.status}
                </td>
                <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  <span className="inline-flex items-center gap-2 text-accent">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Pending Result review
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border p-5">
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-foreground/[0.48]">
          Source tracking preview
        </h3>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
          <ConfigRow
            label="Snapshot"
            value={preview.sourceTracking.sourceSnapshot.status}
          />
          <ConfigRow
            label="Payload"
            value={preview.sourceTracking.sourceSnapshot.payloadType}
          />
          <ConfigRow label="Import run" value={preview.sourceTracking.importRun.status} />
          <ConfigRow
            label="Source links"
            value={String(preview.sourceTracking.sourceLinks.length)}
          />
          <ConfigRow
            label="Data versions"
            value={String(preview.sourceTracking.dataVersions.length)}
          />
        </div>
      </div>
    </Card>
  );
}

function PreviewMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-border bg-surface-muted p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-foreground/[0.48]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-accent">{value}</p>
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
