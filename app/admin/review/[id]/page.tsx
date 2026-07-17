import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  ActionBadge,
  ConfidenceValue,
  ReviewStatusBadge,
} from "@/components/admin/review-badges";
import { ReviewApplyForm } from "@/components/admin/review-apply-form";
import { ReviewDecisionForm } from "@/components/admin/review-decision-form";
import { StandingPublicationForm } from "@/components/admin/standing-publication-form";
import {
  getConnectorReviewDecisionAudit,
  getConnectorReviewItemDetail,
  getOfficialSourceUrl,
} from "@/db/connector-review";
import { getAdminAccessContext, canAccessAdmin } from "@/lib/admin/access";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review Item",
  description: "Internal connector review item detail.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ application?: string; decision?: string }>;
};

export default async function AdminReviewDetailPage({ params, searchParams }: PageProps) {
  const access = await getAdminAccessContext();
  if (!canAccessAdmin(access, "review:view")) notFound();

  const { id } = await params;
  const query = await searchParams;
  const [item, audit] = await Promise.all([
    getConnectorReviewItemDetail(id),
    getConnectorReviewDecisionAudit(id),
  ]);
  const canDecide =
    canAccessAdmin(access, "review:approve") && item.reviewStatus === "PENDING";
  const sourceUrl = getOfficialSourceUrl(item);
  const entityLabel = item.suggestedAction.includes("STAGE_RESULT")
    ? "StageResult"
    : item.suggestedAction.includes("RECORD_CLASSIFICATION")
      ? "RecordClassification"
      : item.suggestedAction.includes("STANDING")
        ? "Standing"
        : item.suggestedAction.includes("RESULT")
          ? "Result"
          : "Event";
  const isStandingCalculationSet =
    item.suggestedAction.includes("STANDING") &&
    hasStringField(item.proposedValues, "calculationSetId");

  return (
    <div className="grid gap-8">
      <section>
        <Link
          href="/admin/review"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
        >
          Back to review queue
        </Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black lg:text-5xl">{item.eventName}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
              Review the source proposal and decide whether this internal proposal should
              be approved or rejected. This stage does not update public data.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ReviewStatusBadge status={item.reviewStatus} />
            <ActionBadge action={item.suggestedAction} />
          </div>
        </div>
      </section>

      {query?.decision ? <DecisionMessage code={query.decision} /> : null}
      {query?.application ? <ApplicationMessage code={query.application} /> : null}

      {item.reviewStatus === "SUPERSEDED" ? (
        <Card className="border-zinc-500/30 bg-zinc-500/5 p-5">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-zinc-300" aria-hidden="true" />
            <div>
              <h2 className="font-black">This proposal is no longer current</h2>
              <p className="mt-2 text-sm text-foreground/[0.62]">
                Superseded review items are retained for history and cannot be approved or
                rejected.
              </p>
              {item.supersededByReviewItemId ? (
                <Link
                  href={`/admin/review/${item.supersededByReviewItemId}`}
                  className="mt-3 inline-flex text-sm font-semibold text-accent"
                >
                  Open newer proposal
                </Link>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <SummaryCard label="Season" value={item.season} />
        <SummaryCard
          label="Confidence"
          value={<ConfidenceValue value={item.confidence} />}
        />
        <SummaryCard label="Matching" value={item.matchingStrategy ?? "manual"} />
        <SummaryCard label="Application" value={item.applicationStatus} />
      </div>

      <Card className="p-5">
        <h2 className="text-xl font-black">Review metadata</h2>
        <div className="mt-5 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
          <Meta label="Review item ID" value={item.id} mono />
          <Meta label="Snapshot ID" value={item.snapshotId} mono />
          <Meta label="Connector" value={item.connectorKey} />
          <Meta label="Source event ID" value={item.sourceEventId ?? "None"} />
          <Meta
            label="Matched current event ID"
            value={item.currentEventId ?? "None"}
            mono
          />
          <Meta
            label="Matched current result ID"
            value={item.currentResultId ?? "None"}
            mono
          />
          <Meta
            label="Matched current stage result ID"
            value={item.currentStageResultId ?? "None"}
            mono
          />
          <Meta
            label="Matched current standing ID"
            value={item.currentStandingId ?? "None"}
            mono
          />
          <Meta label="Snapshot timestamp" value={formatDate(item.snapshot.createdAt)} />
          <Meta label="Snapshot checksum" value={item.snapshot.payloadChecksum} mono />
          <Meta label="Parser" value={item.snapshot.parserSelected} />
          <Meta label="Official source" value={sourceUrl ?? "None"} />
          <Meta label="Review version" value={item.version} />
          <Meta label="Application version" value={item.applicationVersion} />
        </div>
        {item.ambiguityReason ? (
          <div className="mt-5 rounded-md border border-gold/30 bg-gold/10 p-4 text-sm text-gold">
            Manual review: {item.ambiguityReason}
          </div>
        ) : null}
        {item.recommendation ? (
          <p className="mt-5 text-sm leading-6 text-foreground/[0.66]">
            {item.recommendation}
          </p>
        ) : null}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Current vs proposed</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            Changed fields are highlighted. Unknown values remain unchanged until a later
            apply step is built.
          </p>
        </div>
        <div className="grid md:grid-cols-2">
          <ValuePane
            title="Current database value"
            value={item.currentValues}
            changedFields={item.changedFields}
          />
          <ValuePane
            title="Official source proposal"
            value={item.proposedValues}
            changedFields={item.changedFields}
          />
        </div>
      </Card>

      {isStandingCalculationSet ? (
        <Card className="p-5">
          <h2 className="text-xl font-black">Publication</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            Publishing is separate from applying. The public standings page reads only a
            published Standing version.
          </p>
          <div className="mt-5">
            <StandingPublicationForm
              reviewItemId={item.id}
              canPublish={
                canAccessAdmin(access, "standings:publish") &&
                item.reviewStatus === "APPROVED" &&
                item.applicationStatus === "APPLIED"
              }
            />
          </div>
        </Card>
      ) : null}

      <Card className="p-5">
        <h2 className="text-xl font-black">Decision</h2>
        <p className="mt-2 text-sm text-foreground/[0.62]">
          Approval and rejection change only this review item. Public records updated: 0.
        </p>
        <div className="mt-5">
          <ReviewDecisionForm
            reviewItemId={item.id}
            expectedStatus={item.reviewStatus}
            expectedVersion={item.version}
            suggestedAction={item.suggestedAction}
            changedFields={item.changedFields}
            canDecide={canDecide}
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-black">Application</h2>
        <p className="mt-2 text-sm text-foreground/[0.62]">
          Approved does not mean applied. This action writes{" "}
          {isStandingCalculationSet
            ? "one complete Standing calculation set"
            : `one controlled change to the ${entityLabel} database`}{" "}
          after validation and stale-state checks.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Meta label="Application status" value={item.applicationStatus} />
          <Meta label="Applied event ID" value={item.appliedEventId ?? "None"} mono />
          <Meta label="Applied result ID" value={item.appliedResultId ?? "None"} mono />
          <Meta
            label="Applied stage result ID"
            value={item.appliedStageResultId ?? "None"}
            mono
          />
          <Meta
            label="Applied standing ID"
            value={item.appliedStandingId ?? "None"}
            mono
          />
          <Meta label="Applied by" value={item.appliedByUserEmail ?? "None"} />
          <Meta
            label="Applied at"
            value={item.appliedAt ? formatDate(item.appliedAt) : "None"}
          />
        </div>
        {item.applicationError ? (
          <div className="mt-5 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {item.applicationError}
          </div>
        ) : null}
        <div className="mt-5">
          <ReviewApplyForm
            reviewItemId={item.id}
            reviewStatus={item.reviewStatus}
            applicationStatus={item.applicationStatus}
            applicationVersion={item.applicationVersion}
            suggestedAction={item.suggestedAction}
            changedFields={item.changedFields}
            isStandingCalculationSet={isStandingCalculationSet}
            canApply={
              canAccessAdmin(access, "review:approve") &&
              item.reviewStatus === "APPROVED" &&
              ["NOT_APPLIED", "APPLY_FAILED"].includes(item.applicationStatus)
            }
          />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-black">Snapshot diagnostics</h2>
        <pre className="mt-4 max-h-80 overflow-auto rounded-md border border-border bg-surface-muted p-4 text-xs leading-6">
          {JSON.stringify(
            {
              requestedSourceUrl: item.snapshot.requestedSourceUrl,
              finalResponseUrl: item.snapshot.finalResponseUrl,
              httpStatus: item.snapshot.httpStatus,
              contentType: item.snapshot.contentType,
              rawRecordCount: item.snapshot.rawRecordCount,
              usableEventCount: item.snapshot.usableEventCount,
              rejectedRecordCount: item.snapshot.rejectedRecordCount,
              rejectionReasons: item.snapshot.rejectionReasons,
              diagnostics: item.snapshot.diagnostics,
            },
            null,
            2,
          )}
        </pre>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-black">Audit trail</h2>
        {item.decidedAt ? (
          <p className="mt-3 text-sm text-foreground/[0.66]">
            Decision by {item.decidedByUserEmail ?? item.decidedByUserId ?? "unknown"} on{" "}
            {formatDate(item.decidedAt)}
            {item.decisionNote ? `: ${item.decisionNote}` : ""}
          </p>
        ) : (
          <p className="mt-3 text-sm text-foreground/[0.62]">
            No decision has been recorded yet.
          </p>
        )}
        <div className="mt-5 grid gap-3">
          {audit.map((entry) => (
            <div key={entry.id} className="rounded-md border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{entry.action}</p>
                <p className="text-xs text-foreground/[0.48]">
                  {formatDate(entry.createdAt)}
                </p>
              </div>
              <p className="mt-2 text-xs text-foreground/[0.58]">
                Actor: {entry.createdBy ?? "unknown"}
              </p>
              <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-surface-muted p-3 text-xs">
                {JSON.stringify({ previous: entry.previous, next: entry.next }, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </p>
      <div className="mt-2 text-lg font-black">{value}</div>
    </Card>
  );
}

function Meta({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </p>
      <p className={cn("mt-1 break-words", mono && "font-mono text-xs")}>{value}</p>
    </div>
  );
}

function ValuePane({
  title,
  value,
  changedFields,
}: {
  title: string;
  value: unknown;
  changedFields: string[];
}) {
  const entries =
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.entries(value as Record<string, unknown>)
      : [];

  return (
    <div className="border-t border-border p-5 md:border-l md:border-t-0 md:first:border-l-0">
      <h3 className="font-black">{title}</h3>
      {entries.length > 0 ? (
        <dl className="mt-4 grid gap-2">
          {entries.map(([key, entryValue]) => (
            <div
              key={key}
              className={cn(
                "rounded-md border border-border bg-surface-muted p-3",
                changedFields.includes(key) && "border-accent/40 bg-accent/10",
              )}
            >
              <dt className="text-xs uppercase tracking-[0.14em] text-foreground/[0.48]">
                {key}
              </dt>
              <dd className="mt-1 break-words font-mono text-xs">
                {typeof entryValue === "string"
                  ? entryValue
                  : JSON.stringify(entryValue ?? null)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 rounded-md border border-border bg-surface-muted p-4 text-sm text-foreground/[0.62]">
          No value.
        </p>
      )}
    </div>
  );
}

function hasStringField(value: unknown, key: string) {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>)[key] === "string"
  );
}

function DecisionMessage({ code }: { code: string }) {
  const messages: Record<string, { title: string; body: string; tone: "ok" | "warn" }> = {
    approved: {
      title: "Review item approved",
      body: "Only internal review status and audit history were updated.",
      tone: "ok",
    },
    rejected: {
      title: "Review item rejected",
      body: "Only internal review status and audit history were updated.",
      tone: "ok",
    },
    conflict: {
      title: "Decision conflict",
      body: "This review item changed before your decision was saved. Reload and review the current status.",
      tone: "warn",
    },
    invalid: {
      title: "Decision not saved",
      body: "The request was incomplete or invalid.",
      tone: "warn",
    },
    unauthorized: {
      title: "Not authorized",
      body: "Your role cannot approve or reject review items.",
      tone: "warn",
    },
  };
  const message = messages[code] ?? messages.invalid!;

  return (
    <Card
      className={cn(
        "p-5",
        message.tone === "ok" && "border-emerald-500/25 bg-emerald-500/5",
        message.tone === "warn" && "border-red-500/25 bg-red-500/5",
      )}
    >
      <h2 className="font-black">{message.title}</h2>
      <p className="mt-2 text-sm text-foreground/[0.62]">{message.body}</p>
    </Card>
  );
}

function ApplicationMessage({ code }: { code: string }) {
  const messages: Record<string, { title: string; body: string; tone: "ok" | "warn" }> = {
    applied: {
      title: "Approved change applied",
      body: "One controlled Event database change was applied and audited.",
      tone: "ok",
    },
    "already-applied": {
      title: "Already applied",
      body: "This review item was already applied. No duplicate write was performed.",
      tone: "warn",
    },
    conflict: {
      title: "Application conflict",
      body: "The review or Event state changed before application. Reload and review again.",
      tone: "warn",
    },
    invalid: {
      title: "Application failed",
      body: "The proposal could not be safely applied. See application status for details.",
      tone: "warn",
    },
    unsupported: {
      title: "Unsupported action",
      body: "This action type intentionally fails closed in this sprint.",
      tone: "warn",
    },
    unauthorized: {
      title: "Not authorized",
      body: "Your role cannot apply approved review items.",
      tone: "warn",
    },
  };
  const message = messages[code] ?? messages.invalid!;

  return (
    <Card
      className={cn(
        "p-5",
        message.tone === "ok" && "border-emerald-500/25 bg-emerald-500/5",
        message.tone === "warn" && "border-red-500/25 bg-red-500/5",
      )}
    >
      <h2 className="font-black">{message.title}</h2>
      <p className="mt-2 text-sm text-foreground/[0.62]">{message.body}</p>
    </Card>
  );
}
