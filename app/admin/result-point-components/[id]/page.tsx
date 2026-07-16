import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { VersionTimeline } from "@/components/admin/version-timeline";
import { Card } from "@/components/ui/card";
import { getAdminResultPointComponentDetail } from "@/db/admin-result-point-components";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const component = await getAdminResultPointComponentDetail(id);
  return {
    title: component
      ? `${formatEnum(component.componentType)} scoring component`
      : "Scoring Component",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminResultPointComponentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const component = await getAdminResultPointComponentDetail(id);
  if (!component) notFound();

  const riderName = `${component.result.rider.firstName} ${component.result.rider.lastName}`;

  return (
    <div className="grid min-w-0 gap-6 overflow-x-hidden">
      <section className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/result-point-components"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
          >
            Back to scoring components
          </Link>
          <h1 className="mt-3 break-words text-3xl font-black lg:text-4xl">
            {formatEnum(component.componentType)} · {riderName}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Read-only component provenance for future official event point totals. This
            page does not calculate or apply championship scoring.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminStatusBadge status={component.archivedAt ? "locked" : "ready"} />
          <Link
            href={`/admin/results/${component.resultId}`}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Overall Result
          </Link>
        </div>
      </section>

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_320px] 2xl:items-start">
        <Card className="min-w-0 p-4 sm:p-5">
          <h2 className="text-xl font-black">Component details</h2>
          <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
            <ReadOnlyField
              label="Component"
              value={formatEnum(component.componentType)}
            />
            <ReadOnlyField label="Points" value={String(component.points)} />
            <ReadOnlyField label="Position" value={component.position ?? "TBC"} />
            <ReadOnlyField
              label="Classification Scope"
              value={component.classificationScope}
            />
            <ReadOnlyField label="Class" value={component.className ?? "Overall"} />
            <ReadOnlyField
              label="Regulation Table"
              value={component.regulationTableKey}
            />
            <ReadOnlyField
              label="Regulation Version"
              value={`v${component.regulationVersion}`}
            />
            <ReadOnlyField
              label="Regulation Checksum"
              value={component.regulationChecksum}
              mono
            />
            <ReadOnlyField label="Event" value={component.result.event.name} />
            <ReadOnlyField label="Rider" value={riderName} />
            <ReadOnlyField
              label="Stage"
              value={
                component.raceStage?.name ??
                component.stageResult?.stage.name ??
                "No stage link"
              }
            />
            <ReadOnlyField
              label="Stage Result"
              value={component.stageResultId ?? "No stage result link"}
              mono
            />
          </div>
        </Card>

        <aside className="grid min-w-0 gap-4 self-start 2xl:sticky 2xl:top-6">
          <Card className="min-w-0 p-4">
            <h2 className="text-xl font-black">Stored information</h2>
            <div className="mt-5 grid gap-3 text-sm">
              <Meta label="ID" value={component.id} />
              <Meta label="Result ID" value={component.resultId} />
              <Meta label="Created" value={formatDate(component.createdAt)} />
              <Meta label="Last Updated" value={formatDate(component.updatedAt)} />
              <Meta
                label="Archived"
                value={component.archivedAt ? formatDate(component.archivedAt) : "No"}
              />
              <Meta
                label="Source Mode"
                value={component.sourceLinks.length ? "Source-managed" : "Manual"}
              />
              <Meta label="Review Items" value={component.reviewItems.length} />
            </div>
          </Card>

          <Card className="min-w-0 p-4">
            <h2 className="text-xl font-black">Regulation</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <Meta label="Title" value={component.regulation.title} />
              <Meta label="Year" value={component.regulation.regulationYear} />
              <Meta label="Section" value={component.regulation.section} />
              <Meta label="Status" value={component.regulation.status} />
              <Link
                href={`/admin/regulations/${component.regulationId}`}
                className="rounded-md border border-border bg-surface-muted p-3 text-sm font-semibold transition hover:border-accent hover:text-accent"
              >
                Open regulation
              </Link>
            </div>
          </Card>

          <Card className="min-w-0 p-4">
            <h2 className="text-xl font-black">Source lineage</h2>
            <div className="mt-4 grid gap-3">
              {component.sourceSnapshot ? (
                <div className="rounded-md border border-border bg-surface-muted p-3 text-sm">
                  <span className="font-semibold">
                    {component.sourceSnapshot.dataSource.name}
                  </span>
                  <span className="mt-1 block break-all text-xs text-foreground/[0.58]">
                    Snapshot {component.sourceSnapshot.id}
                  </span>
                </div>
              ) : null}
              {component.sourceLinks.length ? (
                component.sourceLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-border bg-surface-muted p-3 text-sm transition hover:border-accent"
                  >
                    <span className="font-semibold">{link.dataSource.name}</span>
                    <span className="mt-1 block break-all text-xs text-foreground/[0.58]">
                      {link.note ?? link.url}
                    </span>
                  </a>
                ))
              ) : (
                <p className="text-sm text-foreground/[0.58]">
                  No source links are attached to this component.
                </p>
              )}
            </div>
          </Card>
        </aside>
      </div>

      <Card className="p-5">
        <h2 className="text-xl font-black">Related review items</h2>
        <div className="mt-5 grid gap-3">
          {component.reviewItems.length ? (
            component.reviewItems.map((item) => (
              <Link
                key={item.id}
                href={`/admin/review/${item.id}`}
                className="rounded-md border border-border bg-surface-muted p-4 text-sm transition hover:border-accent"
              >
                <span className="font-semibold">{item.suggestedAction}</span>
                <span className="ml-2 text-foreground/[0.58]">
                  {item.reviewStatus} / {item.applicationStatus}
                </span>
                <span className="mt-1 block text-xs text-foreground/[0.48]">
                  Snapshot {item.snapshot.id} · {formatDate(item.snapshot.createdAt)}
                </span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-foreground/[0.58]">
              No connector review item is linked to this component.
            </p>
          )}
        </div>
      </Card>

      <VersionTimeline
        items={component.versions.map((version) => ({
          id: version.id,
          title: version.action,
          description: version.actor
            ? `Changed by ${version.actor.displayName ?? version.actor.email ?? "admin"}`
            : "System change",
          action: version.action,
          createdAt: version.createdAt,
        }))}
      />
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-2 text-sm font-semibold">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.54]">
        {label}
      </span>
      <div
        className={`min-w-0 break-words rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-foreground/[0.76] ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.45]">
        {label}
      </span>
      <span className="break-words font-semibold">{value}</span>
    </div>
  );
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
