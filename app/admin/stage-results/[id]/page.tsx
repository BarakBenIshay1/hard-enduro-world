import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassifiableEntityType } from "@prisma/client";
import { ExternalLink } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ClassificationPanel } from "@/components/admin/classification-panel";
import { EventAlert } from "@/components/admin/events/event-alert";
import { EventEditorForm } from "@/components/admin/events/event-editor-form";
import { EventSubmitButton } from "@/components/admin/events/event-submit-button";
import { VersionTimeline } from "@/components/admin/version-timeline";
import { Card } from "@/components/ui/card";
import {
  archiveAdminStageResult,
  restoreAdminStageResult,
  updateAdminStageResult,
} from "@/app/admin/stage-results/actions";
import { getAdminResultOptions, getAdminStageResultDetail } from "@/db/admin-results";
import { getAdminAccessContext } from "@/lib/admin/access";
import { canManageResults, resultStatuses } from "@/lib/admin/result-cms";
import {
  getRecordClassificationHistoryWithEvidence,
  resolveRecordClassification,
} from "@/lib/data-quality/record-classification";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; saved?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getAdminStageResultDetail(id);
  return {
    title: result
      ? `${result.rider.firstName} ${result.rider.lastName} stage result`
      : "Stage Result",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminStageResultDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, query, access, options] = await Promise.all([
    params,
    searchParams,
    getAdminAccessContext(),
    getAdminResultOptions(),
  ]);
  const [result, classification, classificationHistory] = await Promise.all([
    getAdminStageResultDetail(id),
    resolveRecordClassification(ClassifiableEntityType.STAGE_RESULT, id),
    getRecordClassificationHistoryWithEvidence(ClassifiableEntityType.STAGE_RESULT, id),
  ]);
  if (!result) notFound();

  const canManage = canManageResults(access.role);
  const riderName = `${result.rider.firstName} ${result.rider.lastName}`;
  const eventName = result.stage.event.name;

  return (
    <div className="grid min-w-0 gap-6 overflow-x-hidden">
      <section className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/stage-results"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
          >
            Back to stage results
          </Link>
          <h1 className="mt-3 break-words text-3xl font-black lg:text-4xl">
            {riderName} · {result.stage.name}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Edit persisted stage classification fields only. This never recalculates
            overall results, standings, points, statistics, or records.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminStatusBadge status={result.archivedAt ? "locked" : "ready"} />
          <Link
            href="/results"
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Public Results
          </Link>
        </div>
      </section>

      <StageResultMessage code={query?.error ?? query?.saved} />

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_320px] 2xl:items-start">
        <Card className="min-w-0 p-4 sm:p-5">
          <h2 className="text-xl font-black">Stage result editor</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            {canManage
              ? "Manual corrections create version history and preserve source links."
              : "Reviewer access is read-only."}
          </p>
          <EventEditorForm action={updateAdminStageResult} className="mt-5 grid gap-4">
            <input type="hidden" name="stageResultId" value={result.id} />
            <div className="grid min-w-0 gap-3 lg:grid-cols-2">
              <ReadOnlyField label="Event" value={eventName} />
              <ReadOnlyField
                label="Race Stage"
                value={`${result.stage.stageOrder}. ${result.stage.name}`}
              />
              <ReadOnlyField label="Rider" value={riderName} />
              <TextField
                label="Class"
                name="className"
                defaultValue={result.className ?? ""}
                disabled={!canManage}
              />
              <SelectField
                label="Status"
                name="status"
                defaultValue={result.status}
                disabled={!canManage}
              >
                {resultStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Stage Position"
                name="overallPosition"
                type="number"
                defaultValue={result.overallPosition?.toString() ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Class Position"
                name="classPosition"
                type="number"
                defaultValue={result.classPosition?.toString() ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Stage Time"
                name="totalTimeText"
                defaultValue={result.totalTimeText ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Gap to Leader"
                name="gapToLeaderText"
                defaultValue={result.gapToLeaderText ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Gap to Previous"
                name="gapToPreviousText"
                defaultValue={result.gapToPreviousText ?? ""}
                disabled={!canManage}
              />
              <SelectField
                label="Manufacturer"
                name="manufacturerId"
                defaultValue={result.manufacturerId ?? ""}
                disabled={!canManage}
              >
                <option value="">Unassigned</option>
                {options.manufacturers.map((manufacturer) => (
                  <option key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Motorcycle"
                name="motorcycleId"
                defaultValue={result.motorcycleId ?? ""}
                disabled={!canManage}
              >
                <option value="">Unassigned</option>
                {options.motorcycles.map((motorcycle) => (
                  <option key={motorcycle.id} value={motorcycle.id}>
                    {motorcycle.manufacturer.name} {motorcycle.model}
                    {motorcycle.year ? ` ${motorcycle.year}` : ""}
                  </option>
                ))}
              </SelectField>
              <div className="lg:col-span-2">
                <TextArea
                  label="Notes"
                  name="notes"
                  defaultValue={result.notes ?? ""}
                  disabled={!canManage}
                />
              </div>
            </div>
            {canManage ? (
              <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-card/95 p-4 backdrop-blur sm:-mx-5">
                <EventSubmitButton
                  label="Save Stage Result"
                  pendingLabel="Saving..."
                  icon="save"
                />
              </div>
            ) : null}
          </EventEditorForm>
        </Card>

        <aside className="grid min-w-0 gap-4 self-start 2xl:sticky 2xl:top-6">
          <Card className="min-w-0 p-4">
            <h2 className="text-xl font-black">Stored information</h2>
            <div className="mt-5 grid gap-3 text-sm">
              <Meta label="ID" value={result.id} />
              <Meta label="Event" value={eventName} />
              <Meta label="Stage" value={result.stage.name} />
              <Meta label="Rider" value={riderName} />
              <Meta label="Created" value={formatDate(result.createdAt)} />
              <Meta label="Last Updated" value={formatDate(result.updatedAt)} />
              <Meta
                label="Archived"
                value={result.archivedAt ? formatDate(result.archivedAt) : "No"}
              />
              <Meta
                label="Source Mode"
                value={result.sourceLinks.length ? "Source-managed" : "Manual"}
              />
              <Meta label="Review Items" value={result.reviewItems.length} />
            </div>
          </Card>

          <Card className="min-w-0 p-4">
            <h2 className="text-xl font-black">Source lineage</h2>
            <div className="mt-4 grid gap-3">
              {result.sourceLinks.length ? (
                result.sourceLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-border bg-surface-muted p-3 text-sm transition hover:border-accent"
                  >
                    <span className="font-semibold">{link.dataSource.name}</span>
                    <span className="mt-1 block text-xs text-foreground/[0.58]">
                      {link.note ?? link.url}
                    </span>
                  </a>
                ))
              ) : (
                <p className="text-sm text-foreground/[0.58]">
                  No source links are attached to this stage result.
                </p>
              )}
            </div>
          </Card>

          <ClassificationPanel
            resolution={classification}
            history={classificationHistory}
          />

          <Card className="min-w-0 p-4">
            <h2 className="text-xl font-black">Archive</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
              Archiving hides this row from normal admin lists while preserving lineage
              and audit history.
            </p>
            {canManage && !result.archivedAt ? (
              <form action={archiveAdminStageResult} className="mt-5 grid gap-3">
                <input type="hidden" name="stageResultId" value={result.id} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="confirmArchive" />
                  Confirm archive
                </label>
                <EventSubmitButton
                  label="Archive Stage Result"
                  pendingLabel="Archiving..."
                  icon="archive"
                  tone="danger"
                />
              </form>
            ) : canManage && result.archivedAt ? (
              <form action={restoreAdminStageResult} className="mt-5 grid gap-3">
                <input type="hidden" name="stageResultId" value={result.id} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="confirmRestore" />
                  Confirm restore
                </label>
                <EventSubmitButton
                  label="Restore Stage Result"
                  pendingLabel="Restoring..."
                  icon="restore"
                  tone="neutral"
                />
              </form>
            ) : (
              <p className="mt-4 text-sm text-foreground/[0.58]">
                {result.archivedAt
                  ? "This stage result is archived."
                  : "Read-only access."}
              </p>
            )}
          </Card>
        </aside>
      </div>

      <Card className="p-5">
        <h2 className="text-xl font-black">Related review items</h2>
        <div className="mt-5 grid gap-3">
          {result.reviewItems.length ? (
            result.reviewItems.map((item) => (
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
              No connector review item is linked to this row.
            </p>
          )}
        </div>
      </Card>

      <VersionTimeline
        items={result.versions.map((version) => ({
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

function StageResultMessage({ code }: { code?: string }) {
  if (!code) return null;
  const messages: Record<string, string> = {
    updated: "Stage result saved.",
    archived: "Stage result archived.",
    restored: "Stage result restored.",
    unauthorized: "You do not have permission to manage stage results.",
    "archive-confirmation": "Confirm archive before submitting.",
    "restore-confirmation": "Confirm restore before submitting.",
    "duplicate-stage-result": "A result already exists for this stage, rider, and class.",
    "dns-position-time": "DNS rows cannot keep a finish position or time.",
    "invalid-number": "Enter positive whole numbers for positions.",
    "invalid-total-time": "Enter a valid official time value.",
    "invalid-gap": "Enter a valid official gap value.",
    "archived-locked": "Restore the stage result before editing it.",
    "database-unavailable": "The stage result could not be saved. Please try again.",
  };
  return (
    <EventAlert
      tone={["updated", "archived", "restored"].includes(code) ? "success" : "error"}
    >
      {messages[code] ?? code}
    </EventAlert>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  disabled,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.54]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        className="min-w-0 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm disabled:opacity-60"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.54]">
        {label}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        rows={4}
        className="min-w-0 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm disabled:opacity-60"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  disabled,
  children,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.54]">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="min-w-0 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm disabled:opacity-60"
      >
        {children}
      </select>
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 text-sm font-semibold">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.54]">
        {label}
      </span>
      <div className="min-w-0 rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-foreground/[0.76]">
        {value}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.45]">
        {label}
      </span>
      <span className="break-words font-semibold">{value}</span>
    </div>
  );
}
