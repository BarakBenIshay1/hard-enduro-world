import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassifiableEntityType, DataOriginStatus } from "@prisma/client";

import {
  generateClassificationCandidateProposal,
  proposeRecordClassificationChange,
} from "@/app/admin/classifications/actions";
import { ClassificationBadge } from "@/components/admin/classification-badge";
import { EventSubmitButton } from "@/components/admin/events/event-submit-button";
import { Card } from "@/components/ui/card";
import { entityTypeLabel } from "@/db/admin-classifications";
import { generateClassificationCandidate } from "@/lib/data-quality/classification-intelligence";
import { classifiableEntityTypes } from "@/lib/data-quality/record-classification";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Classification Candidate",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  params: Promise<{ entityType: string; entityId: string }>;
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
] as const;

export default async function ClassificationCandidateDetailPage({ params }: PageProps) {
  const { entityType: rawEntityType, entityId } = await params;
  const entityType = parseEntityType(rawEntityType);
  if (!entityType || !entityId) notFound();

  const candidate = await generateClassificationCandidate({
    entityType,
    entityId,
    mode: "DETAIL",
  });
  if (!candidate.supported) notFound();
  const returnPath = `/admin/classifications/candidates/${candidate.entityType}/${candidate.entityId}`;

  return (
    <div className="grid min-w-0 gap-6">
      <section>
        <Link
          href="/admin/classifications"
          className="text-sm font-semibold text-accent hover:underline"
        >
          Back to classifications
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Classification Candidate
        </p>
        <h1 className="mt-2 text-3xl font-black lg:text-5xl">
          {candidate.entityLabel ?? candidate.entityId}
        </h1>
        <p className="mt-3 text-sm text-foreground/[0.62]">
          {entityTypeLabel(candidate.entityType)} · {candidate.entityId}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <Metric label="Candidate state" value={candidate.candidateState} />
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/[0.52]">
            Suggested classification
          </div>
          <div className="mt-3">
            {candidate.suggestedStatus ? (
              <ClassificationBadge status={candidate.suggestedStatus} />
            ) : (
              <span className="text-sm text-foreground/[0.58]">No candidate</span>
            )}
          </div>
        </Card>
        <Card className="p-5">
          <Metric
            label="Proposal eligibility"
            value={candidate.eligible ? "Eligible" : "Not eligible"}
          />
        </Card>
      </section>

      <Card className="p-5">
        <h2 className="text-xl font-black">Resolution trace</h2>
        <div className="mt-4 grid gap-3 text-sm">
          <Meta label="Reason" value={candidate.reason} />
          <Meta label="Transition" value={candidate.transitionType} />
          <Meta label="Analysis support" value={candidate.analysisSupport} />
          <Meta label="Proposal support" value={candidate.proposalSupport} />
          <Meta
            label="Proposal disabled reason"
            value={candidate.proposalDisabledReason ?? "None"}
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-black">Rule results</h2>
        <div className="mt-4 grid gap-3">
          {candidate.rules.map((rule) => (
            <div
              key={rule.ruleKey}
              className="rounded-md border border-border bg-card p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{rule.label}</span>
                <span className="text-xs text-foreground/[0.58]">
                  {rule.outcome} · {rule.severity}
                </span>
              </div>
              <p className="mt-2 text-sm text-foreground/[0.62]">{rule.detail}</p>
              <p className="mt-2 text-xs text-foreground/[0.45]">
                {rule.ruleKey} · {rule.category}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <CandidateList title="Missing evidence" items={candidate.missingEvidence} />
        <CandidateList title="Blocking issues" items={candidate.blockingIssues} />
        <CandidateList title="Warnings" items={candidate.warnings} />
        <CandidateList
          title="Parent/child warnings"
          items={candidate.parentChildWarnings}
        />
      </section>

      <Card className="p-5">
        <h2 className="text-xl font-black">Evidence graph</h2>
        <div className="mt-4 grid gap-3 text-sm">
          <Meta label="SourceLink" value={candidate.evidence.sourceLinkLabel ?? "None"} />
          <Meta
            label="SourceSnapshot"
            value={candidate.evidence.sourceSnapshotLabel ?? "None"}
          />
          <Meta
            label="Supporting review"
            value={candidate.evidence.connectorReviewLabel ?? "None"}
          />
          <Meta
            label="Complete chains"
            value={candidate.evidence.completeOwnershipChains.join("; ") || "None"}
          />
          <Meta
            label="Incomplete chains"
            value={candidate.evidence.incompleteChains.join("; ") || "None"}
          />
          <Meta
            label="Conflicts"
            value={candidate.evidence.conflicts.join("; ") || "None"}
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-black">Checksums</h2>
        <div className="mt-4 grid gap-3 text-sm">
          <Meta label="Candidate" value={candidate.candidateChecksum} />
          <Meta label="Entity" value={candidate.entityChecksum} />
          <Meta label="Lifecycle" value={candidate.lifecycleChecksum} />
          <Meta
            label="Current classification"
            value={candidate.currentClassificationChecksum}
          />
          <Meta label="Evidence" value={candidate.evidence.checksum} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-black">Proposal controls</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Proposal generation creates a Review item only. It does not create, update,
          supersede, or apply a RecordClassification.
        </p>

        {candidate.eligible && candidate.suggestedStatus ? (
          <form
            action={generateClassificationCandidateProposal}
            className="mt-5 grid gap-3"
          >
            <input type="hidden" name="entityType" value={candidate.entityType} />
            <input type="hidden" name="entityId" value={candidate.entityId} />
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
        ) : (
          <p className="mt-4 rounded-md border border-border bg-black/20 p-3 text-sm text-foreground/[0.62]">
            This candidate is not currently eligible for proposal generation.
          </p>
        )}

        <details className="mt-5 rounded-md border border-border bg-black/20 p-4">
          <summary className="cursor-pointer text-sm font-bold">
            Advanced: create a deliberate manual proposal
          </summary>
          <p className="mt-3 text-sm leading-6 text-foreground/[0.62]">
            Use this only when an authorized administrator has reviewed evidence that the
            deterministic candidate cannot fully express. This still creates the same
            Review proposal type and does not apply a classification.
          </p>
          <form action={proposeRecordClassificationChange} className="mt-4 grid gap-3">
            <input type="hidden" name="entityType" value={candidate.entityType} />
            <input type="hidden" name="entityId" value={candidate.entityId} />
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
      </Card>
    </div>
  );
}

function CandidateList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-black">{title}</h2>
      {items.length ? (
        <ul className="mt-3 grid gap-2 text-sm text-foreground/[0.68]">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-foreground/[0.55]">None</p>
      )}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/[0.52]">
        {label}
      </div>
      <div className="mt-3 break-words text-xl font-black">{value}</div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.45]">
        {label}
      </span>
      <span className="break-words font-semibold">{value}</span>
    </div>
  );
}

function parseEntityType(value: string) {
  return classifiableEntityTypes.includes(value as ClassifiableEntityType)
    ? (value as ClassifiableEntityType)
    : null;
}
