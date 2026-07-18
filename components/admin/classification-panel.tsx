import Link from "next/link";
import {
  ClassifiableEntityType,
  DataOriginStatus,
  type RecordClassification,
} from "@prisma/client";
import {
  generateClassificationCandidateProposal,
  proposeRecordClassificationChange,
} from "@/app/admin/classifications/actions";
import { ClassificationBadge } from "@/components/admin/classification-badge";
import { EventSubmitButton } from "@/components/admin/events/event-submit-button";
import type { ClassificationResolution } from "@/lib/data-quality/record-classification";
import { generateRecordClassificationCandidate } from "@/lib/data-quality/record-classification-candidates";
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

const manualProposalStatuses = [
  DataOriginStatus.VERIFIED_OFFICIAL,
  DataOriginStatus.SOURCE_MANAGED_UNVERIFIED,
  DataOriginStatus.AUDITED_MANUAL,
  DataOriginStatus.MANUAL_PLACEHOLDER,
  DataOriginStatus.DEMO,
  DataOriginStatus.SEED,
  DataOriginStatus.VALIDATION,
  DataOriginStatus.UNKNOWN,
  DataOriginStatus.CONFLICTING,
];

export async function ClassificationPanel({
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
  const candidate =
    canPropose && entityType && entityId
      ? await generateRecordClassificationCandidate(entityType, entityId)
      : null;

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

      {candidate && entityType && entityId && returnPath ? (
        <div className="rounded-md border border-accent/25 bg-surface-muted p-4">
          <h3 className="text-lg font-black">Classification candidate</h3>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            Rule-based suggestion from existing lineage only. Generating a review proposal
            does not create a classification, DataVersion, SourceLink, or apply any
            change.
          </p>

          <div className="mt-4 grid gap-3">
            <div className="rounded-md border border-border bg-black/20 p-3">
              <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.45]">
                Candidate state
              </span>
              <p className="mt-2 font-semibold">{candidate.candidateState}</p>
              <p className="mt-2 text-xs text-foreground/[0.56]">
                Proposal eligibility:{" "}
                {candidate.eligible ? "Ready for review proposal" : "Not eligible"}
              </p>
            </div>

            <div className="rounded-md border border-border bg-black/20 p-3">
              <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.45]">
                Suggested classification
              </span>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {candidate.suggestedStatus ? (
                  <ClassificationBadge status={candidate.suggestedStatus} />
                ) : (
                  <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-foreground/[0.58]">
                    No candidate
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground/[0.68]">
                {candidate.reason}
              </p>
            </div>

            <div className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.45]">
                Rule match
              </span>
              {candidate.rules.map((rule) => (
                <div
                  key={`${rule.label}-${rule.detail}`}
                  className="grid gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm"
                >
                  <span
                    className={
                      rule.state === "matched"
                        ? "font-semibold text-emerald-300"
                        : rule.state === "blocked"
                          ? "font-semibold text-red-300"
                          : rule.state === "info"
                            ? "font-semibold text-sky-300"
                            : "font-semibold text-yellow-200"
                    }
                  >
                    {rule.state === "matched"
                      ? "PASS"
                      : rule.state === "info"
                        ? "INFO"
                        : "MISSING"}{" "}
                    - {rule.label}
                  </span>
                  <span className="text-xs text-foreground/[0.56]">{rule.detail}</span>
                </div>
              ))}
            </div>

            <CandidateList
              title="Supporting evidence"
              items={[
                candidate.evidence.sourceLinkLabel,
                candidate.evidence.sourceSnapshotLabel,
                candidate.evidence.connectorReviewLabel,
              ].filter(Boolean)}
              empty="No supporting evidence attached."
            />
            <CandidateList
              title="Missing evidence"
              items={candidate.missingEvidence}
              empty="No missing evidence for this candidate."
            />
            <CandidateList
              title="Blocking issues"
              items={candidate.blockingIssues}
              empty="No blocking issues detected."
            />
          </div>

          {candidate.eligible && candidate.suggestedStatus ? (
            <form
              action={generateClassificationCandidateProposal}
              className="mt-4 grid gap-3"
            >
              <input type="hidden" name="entityType" value={entityType} />
              <input type="hidden" name="entityId" value={entityId} />
              <input type="hidden" name="returnPath" value={returnPath} />
              <input
                type="hidden"
                name="candidateChecksum"
                value={candidate.candidateChecksum}
              />
              <EventSubmitButton
                label="Generate Review Proposal"
                pendingLabel="Generating..."
                icon="save"
              />
            </form>
          ) : null}

          <details className="mt-5 rounded-md border border-border bg-black/20 p-4">
            <summary className="cursor-pointer text-sm font-bold">
              Advanced: create a deliberate manual proposal
            </summary>
            <p className="mt-3 text-sm leading-6 text-foreground/[0.62]">
              Use this only when the deterministic candidate is incomplete but an
              authorized administrator has reviewed the evidence. This creates the same
              Review proposal type and still does not create a classification or apply any
              change.
            </p>
            <form action={proposeRecordClassificationChange} className="mt-4 grid gap-3">
              <input type="hidden" name="entityType" value={entityType} />
              <input type="hidden" name="entityId" value={entityId} />
              <input type="hidden" name="returnPath" value={returnPath} />
              <label className="grid gap-2 text-sm">
                <span className="font-semibold">Classification</span>
                <select
                  name="originStatus"
                  className="rounded-md border border-border bg-card px-3 py-2 text-foreground"
                  required
                >
                  {manualProposalStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-semibold">Reason</span>
                <textarea
                  name="reason"
                  className="min-h-24 rounded-md border border-border bg-card px-3 py-2 text-foreground"
                  placeholder="Explain the reviewed evidence and why this classification should enter Review."
                  required
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-semibold">Evidence JSON</span>
                <textarea
                  name="evidence"
                  className="min-h-24 rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-foreground"
                  placeholder='{"reviewedBy":"admin","notes":"..."}'
                />
              </label>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm">
                  <span className="font-semibold">SourceLink ID</span>
                  <input
                    name="sourceLinkId"
                    className="rounded-md border border-border bg-card px-3 py-2 text-foreground"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="font-semibold">SourceSnapshot ID</span>
                  <input
                    name="sourceSnapshotId"
                    className="rounded-md border border-border bg-card px-3 py-2 text-foreground"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="font-semibold">Review Item ID</span>
                  <input
                    name="connectorReviewItemId"
                    className="rounded-md border border-border bg-card px-3 py-2 text-foreground"
                  />
                </label>
              </div>
              <EventSubmitButton
                label="Generate Manual Review Proposal"
                pendingLabel="Generating..."
                icon="save"
              />
            </form>
          </details>
        </div>
      ) : null}
    </div>
  );
}

function CandidateList({
  title,
  items,
  empty,
}: {
  title: string;
  items: (string | null)[];
  empty: string;
}) {
  return (
    <div className="rounded-md border border-border bg-black/20 p-3">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.45]">
        {title}
      </span>
      {items.length ? (
        <ul className="mt-2 grid gap-1 text-sm text-foreground/[0.68]">
          {items.map((item) => (
            <li key={item ?? ""}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-foreground/[0.55]">{empty}</p>
      )}
    </div>
  );
}

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
