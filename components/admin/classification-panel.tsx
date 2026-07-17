import Link from "next/link";
import {
  ClassifiableEntityType,
  DataOriginStatus,
  type RecordClassification,
} from "@prisma/client";
import { proposeRecordClassificationChange } from "@/app/admin/classifications/actions";
import { ClassificationBadge } from "@/components/admin/classification-badge";
import { EventSubmitButton } from "@/components/admin/events/event-submit-button";
import type { ClassificationResolution } from "@/lib/data-quality/record-classification";
import { formatDate } from "@/lib/format";

type EvidenceClassification = RecordClassification & {
  sourceLink?: {
    id: string;
    url: string;
    note: string | null;
    dataSource: { id: string; name: string };
  } | null;
  sourceSnapshot?: {
    id: string;
    url: string;
    contentHash: string;
    fetchedAt: Date;
    dataSource: { id: string; name: string };
  } | null;
  connectorReviewItem?: {
    id: string;
    suggestedAction: string;
    reviewStatus: string;
    applicationStatus: string;
    snapshot?: { id: string; sourceKey: string; createdAt: Date } | null;
  } | null;
};

export function ClassificationPanel({
  resolution,
  history,
  entityType,
  entityId,
  returnPath,
  canPropose = false,
}: {
  resolution: ClassificationResolution;
  history: EvidenceClassification[];
  entityType?: ClassifiableEntityType;
  entityId?: string;
  returnPath?: string;
  canPropose?: boolean;
}) {
  const active = history.find((item) => item.supersededAt === null) ?? null;
  const historical = history.filter((item) => item.supersededAt !== null);

  return (
    <div className="grid gap-4">
      <div className="rounded-md border border-border bg-surface-muted p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Classification</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
              Read-only origin state. This does not change workflow eligibility, connector
              behavior, or public visibility.
            </p>
          </div>
          <ClassificationBadge resolution={resolution} />
        </div>

        {active ? (
          <div className="mt-5 grid gap-3 text-sm">
            <Meta label="Origin Status" value={active.originStatus} />
            <Meta label="Reason" value={active.reason} />
            <Meta label="Created" value={formatDate(active.createdAt)} />
            <Meta label="Updated" value={formatDate(active.updatedAt)} />
            <Meta
              label="Superseded"
              value={active.supersededAt ? formatDate(active.supersededAt) : "No"}
            />
            <EvidenceBlock classification={active} />
          </div>
        ) : (
          <div className="mt-5 rounded-md border border-border bg-black/20 p-4 text-sm text-foreground/[0.62]">
            Unclassified. No evidence attached.
          </div>
        )}
      </div>

      {historical.length ? (
        <div className="rounded-md border border-border bg-surface-muted p-4">
          <h3 className="text-lg font-black">Classification history</h3>
          <div className="mt-4 grid gap-3">
            {historical.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-border bg-black/20 p-3 text-sm"
              >
                <ClassificationBadge status={item.originStatus} />
                <div className="mt-3 grid gap-2">
                  <Meta label="Reason" value={item.reason} />
                  <Meta label="Created" value={formatDate(item.createdAt)} />
                  <Meta
                    label="Superseded"
                    value={item.supersededAt ? formatDate(item.supersededAt) : "No"}
                  />
                  <EvidenceBlock classification={item} compact />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {canPropose && entityType && entityId && returnPath ? (
        <div className="rounded-md border border-accent/25 bg-surface-muted p-4">
          <h3 className="text-lg font-black">Propose classification change</h3>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            Creates an internal review item only. Classification rows are written only
            after approval and explicit apply.
          </p>
          <form action={proposeRecordClassificationChange} className="mt-4 grid gap-3">
            <input type="hidden" name="entityType" value={entityType} />
            <input type="hidden" name="entityId" value={entityId} />
            <input type="hidden" name="returnPath" value={returnPath} />

            <label className="grid gap-1 text-sm font-semibold">
              Origin status
              <select
                name="originStatus"
                required
                defaultValue={resolution.originStatus ?? DataOriginStatus.UNKNOWN}
                className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              >
                {proposableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-semibold">
              Reason
              <textarea
                name="reason"
                required
                rows={3}
                className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                placeholder="Explain why this classification is being proposed."
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold">
              Evidence JSON or note
              <textarea
                name="evidence"
                rows={3}
                className="rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-accent"
                placeholder='{"verifiedBy":"admin review"}'
              />
            </label>

            <TextInput label="SourceLink ID" name="sourceLinkId" />
            <TextInput label="SourceSnapshot ID" name="sourceSnapshotId" />
            <TextInput label="ConnectorReviewItem ID" name="connectorReviewItemId" />

            <div className="rounded-md border border-border bg-black/20 p-3 text-xs leading-5 text-foreground/[0.62]">
              Verified official classifications require SourceSnapshot evidence.
              Source-managed classifications require source or applied-review evidence.
            </div>

            <EventSubmitButton
              label="Create Review Proposal"
              pendingLabel="Creating..."
              icon="save"
            />
          </form>
        </div>
      ) : null}
    </div>
  );
}

const proposableStatuses = [
  DataOriginStatus.VERIFIED_OFFICIAL,
  DataOriginStatus.SOURCE_MANAGED_UNVERIFIED,
  DataOriginStatus.AUDITED_MANUAL,
  DataOriginStatus.MANUAL_PLACEHOLDER,
  DataOriginStatus.DEMO,
  DataOriginStatus.SEED,
  DataOriginStatus.VALIDATION,
  DataOriginStatus.UNKNOWN,
  DataOriginStatus.CONFLICTING,
] as const;

function EvidenceBlock({
  classification,
  compact = false,
}: {
  classification: EvidenceClassification;
  compact?: boolean;
}) {
  const hasEvidence =
    classification.evidence ||
    classification.sourceLink ||
    classification.sourceSnapshot ||
    classification.connectorReviewItem;

  if (!hasEvidence) {
    return <Meta label="Evidence" value="No evidence attached" />;
  }

  return (
    <div className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.45]">
        Evidence
      </span>
      <div className="grid gap-2">
        {classification.sourceLink ? (
          <a
            href={classification.sourceLink.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-card px-3 py-2 text-sm transition hover:border-accent"
          >
            <span className="font-semibold">
              SourceLink · {classification.sourceLink.dataSource.name}
            </span>
            <span className="mt-1 block break-all text-xs text-foreground/[0.58]">
              {classification.sourceLink.note ?? classification.sourceLink.url}
            </span>
          </a>
        ) : null}
        {classification.sourceSnapshot ? (
          <div className="rounded-md border border-border bg-card px-3 py-2 text-sm">
            <span className="font-semibold">
              SourceSnapshot · {classification.sourceSnapshot.dataSource.name}
            </span>
            <span className="mt-1 block break-all text-xs text-foreground/[0.58]">
              {classification.sourceSnapshot.id} ·{" "}
              {classification.sourceSnapshot.contentHash}
            </span>
          </div>
        ) : null}
        {classification.connectorReviewItem ? (
          <Link
            href={`/admin/review/${classification.connectorReviewItem.id}`}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm transition hover:border-accent"
          >
            <span className="font-semibold">
              ConnectorReviewItem · {classification.connectorReviewItem.suggestedAction}
            </span>
            <span className="mt-1 block text-xs text-foreground/[0.58]">
              {classification.connectorReviewItem.reviewStatus} /{" "}
              {classification.connectorReviewItem.applicationStatus}
            </span>
          </Link>
        ) : null}
        {classification.evidence ? (
          <pre
            className={`overflow-x-auto rounded-md border border-border bg-card p-3 font-mono text-xs text-foreground/[0.72] ${
              compact ? "max-h-32" : "max-h-56"
            }`}
          >
            {JSON.stringify(classification.evidence, null, 2)}
          </pre>
        ) : null}
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

function TextInput({ label, name }: { label: string; name: string }) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      <input
        name={name}
        className="rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-accent"
      />
    </label>
  );
}
