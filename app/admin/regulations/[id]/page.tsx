import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassifiableEntityType } from "@prisma/client";
import { ClassificationPanel } from "@/components/admin/classification-panel";
import { VersionTimeline } from "@/components/admin/version-timeline";
import { Card } from "@/components/ui/card";
import {
  activateAdminRegulation,
  archiveAdminRegulation,
  createNewAdminRegulationVersion,
  deactivateAdminRegulation,
  restoreAdminRegulation,
  updateAdminRegulation,
} from "@/app/admin/regulations/actions";
import {
  getAdminRegulationDetail,
  getRegulationFormOptions,
} from "@/db/admin-regulations";
import { getAdminAccessContext, canAccessAdmin } from "@/lib/admin/access";
import {
  getRecordClassificationHistoryWithEvidence,
  resolveRecordClassification,
} from "@/lib/data-quality/record-classification";
import { formatDate } from "@/lib/format";
import {
  parsePointsMapping,
  parseTieBreakRules,
} from "@/lib/regulations/championship-regulations";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const regulation = await getAdminRegulationDetail(id);
  return {
    title: regulation ? regulation.title : "Regulation",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminRegulationDetailPage({ params }: PageProps) {
  const access = await getAdminAccessContext();
  if (!canAccessAdmin(access, "calculations:view")) notFound();
  const { id } = await params;
  const [regulation, classification, classificationHistory] = await Promise.all([
    getAdminRegulationDetail(id),
    resolveRecordClassification(ClassifiableEntityType.CHAMPIONSHIP_REGULATION, id),
    getRecordClassificationHistoryWithEvidence(
      ClassifiableEntityType.CHAMPIONSHIP_REGULATION,
      id,
    ),
  ]);
  if (!regulation) notFound();
  const options = await getRegulationFormOptions();
  const canManage = canAccessAdmin(access, "calculations:review");
  const canProposeClassification = canAccessAdmin(access, "sources:manage");

  const points = parsePointsMapping(regulation.pointsMapping);
  const tieBreaks = parseTieBreakRules(regulation.tieBreakRules);

  return (
    <div className="grid min-w-0 gap-6">
      <section>
        <Link
          href="/admin/regulations"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
        >
          Back to regulations
        </Link>
        <h1 className="mt-3 text-3xl font-black lg:text-5xl">{regulation.title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Official regulation source, points mapping, tie-break configuration, and version
          history.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-5">
          <h2 className="text-xl font-black">Source</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <Meta label="Season" value={regulation.season.name} />
            <Meta label="Scope" value={regulation.classificationScope} />
            <Meta label="Class" value={regulation.className ?? "Overall"} />
            <Meta label="Version" value={`v${regulation.version}`} />
            <Meta label="Status" value={regulation.status} />
            <Meta label="Source URL" value={regulation.sourceUrl} mono />
            <Meta label="Section" value={regulation.section} />
            <Meta
              label="Verification Date"
              value={formatDate(regulation.verificationDate)}
            />
            <Meta
              label="Content Checksum"
              value={regulation.contentChecksum ?? "None"}
              mono
            />
            <Meta
              label="Source Snapshot"
              value={regulation.sourceSnapshot?.id ?? "None"}
              mono
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-black">Validation</h2>
          <div className="mt-5 grid gap-3 text-sm">
            {regulation.validationIssues.length ? (
              regulation.validationIssues.map((issue) => (
                <Meta
                  key={`${issue.code}-${issue.message}`}
                  label={issue.code}
                  value={issue.message}
                />
              ))
            ) : (
              <Meta label="Status" value="Valid" />
            )}
          </div>
        </Card>
      </div>

      <ClassificationPanel
        resolution={classification}
        history={classificationHistory}
        entityType={ClassifiableEntityType.CHAMPIONSHIP_REGULATION}
        entityId={regulation.id}
        returnPath={`/admin/regulations/${regulation.id}`}
        canPropose={canProposeClassification}
      />

      <Card className="p-5">
        <h2 className="text-xl font-black">Lifecycle</h2>
        <p className="mt-2 text-sm text-foreground/[0.62]">
          Active regulations cannot be materially edited in place. Create a new version
          for business-rule changes.
        </p>
        {canManage ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <TransitionButton
              id={regulation.id}
              label="Activate"
              action={activateAdminRegulation}
            />
            <TransitionButton
              id={regulation.id}
              label="Deactivate"
              action={deactivateAdminRegulation}
            />
            {regulation.archivedAt ? (
              <TransitionButton
                id={regulation.id}
                label="Restore"
                action={restoreAdminRegulation}
              />
            ) : (
              <TransitionButton
                id={regulation.id}
                label="Archive"
                action={archiveAdminRegulation}
              />
            )}
            <TransitionButton
              id={regulation.id}
              label="Create New Version"
              action={createNewAdminRegulationVersion}
            />
          </div>
        ) : null}
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-black">Edit draft</h2>
        {regulation.status === "ACTIVE" ? (
          <p className="mt-4 text-sm text-foreground/[0.62]">
            This regulation is active and locked. Create a new version to change source,
            points, or tie-break rules.
          </p>
        ) : canManage ? (
          <form action={updateAdminRegulation} className="mt-5 grid gap-4">
            <input type="hidden" name="regulationId" value={regulation.id} />
            <RegulationFields regulation={regulation} options={options} />
            <button className="inline-flex h-11 w-fit items-center rounded-md bg-accent px-5 text-sm font-black text-black">
              Save Draft
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-foreground/[0.62]">
            You have read-only access to regulation records.
          </p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-black">Points mapping</h2>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((entry) => (
            <Meta
              key={entry.position}
              label={`Position ${entry.position}`}
              value={entry.points}
            />
          ))}
          {points.length === 0 ? (
            <p className="text-sm text-foreground/[0.58]">No valid points mapping.</p>
          ) : null}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-black">Tie-break rules</h2>
        <div className="mt-5 grid gap-3 text-sm">
          {tieBreaks.map((rule) => (
            <Meta
              key={`${rule.order}-${rule.type}`}
              label={`${rule.order}. ${rule.type}`}
              value={`${rule.description} (${rule.section})`}
            />
          ))}
          {tieBreaks.length === 0 ? (
            <p className="text-sm text-foreground/[0.58]">No valid tie-break rules.</p>
          ) : null}
        </div>
      </Card>

      <VersionTimeline
        items={regulation.versions.map((version) => ({
          id: version.id,
          title: version.action,
          description: version.createdBy
            ? `Changed by ${version.createdBy}`
            : "System change",
          action: version.action,
          createdAt: version.createdAt,
        }))}
      />

      <Card className="p-5">
        <h2 className="text-xl font-black">Related points proposals</h2>
        <div className="mt-4 grid gap-2 text-sm">
          {regulation.relatedProposals.map((proposal) => (
            <Meta
              key={proposal.id}
              label={proposal.suggestedAction}
              value={`${proposal.reviewStatus} · ${proposal.applicationStatus}`}
            />
          ))}
          {regulation.relatedProposals.length === 0 ? (
            <p className="text-foreground/[0.58]">No related proposals.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function TransitionButton({
  id,
  label,
  action,
}: {
  id: string;
  label: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="regulationId" value={id} />
      <label className="sr-only">
        <input type="checkbox" name="confirmTransition" defaultChecked />
        Confirm {label}
      </label>
      <button className="inline-flex h-10 items-center rounded-md border border-border bg-surface-muted px-4 text-sm font-semibold transition hover:border-accent hover:text-accent">
        {label}
      </button>
    </form>
  );
}

function RegulationFields({
  regulation,
  options,
}: {
  regulation: NonNullable<Awaited<ReturnType<typeof getAdminRegulationDetail>>>;
  options: Awaited<ReturnType<typeof getRegulationFormOptions>>;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Season
          <select
            name="seasonId"
            defaultValue={regulation.seasonId}
            required
            className="rounded-md border border-border bg-surface-muted p-3"
          >
            {options.seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>
        </label>
        <Input
          name="regulationYear"
          label="Regulation Year"
          type="number"
          required
          defaultValue={regulation.regulationYear}
        />
        <Input
          name="title"
          label="Source Title"
          required
          defaultValue={regulation.title}
        />
        <Input
          name="sourceUrl"
          label="Official Source URL"
          required
          defaultValue={regulation.sourceUrl}
        />
        <Input
          name="section"
          label="Section / Article"
          required
          defaultValue={regulation.section}
        />
        <Input
          name="verificationDate"
          label="Verification Date"
          type="date"
          required
          defaultValue={dateInput(regulation.verificationDate)}
        />
        <Input
          name="classificationScope"
          label="Classification Scope"
          defaultValue={regulation.classificationScope}
        />
        <Input
          name="className"
          label="Class Name"
          defaultValue={regulation.className ?? ""}
        />
        <Input
          name="effectiveFrom"
          label="Effective From"
          type="date"
          defaultValue={dateInput(regulation.effectiveFrom)}
        />
        <Input
          name="effectiveTo"
          label="Effective To"
          type="date"
          defaultValue={dateInput(regulation.effectiveTo)}
        />
        <Input
          name="contentChecksum"
          label="Content Checksum"
          defaultValue={regulation.contentChecksum ?? ""}
        />
        <label className="grid gap-2 text-sm font-semibold">
          Source Snapshot
          <select
            name="sourceSnapshotId"
            defaultValue={regulation.sourceSnapshotId ?? ""}
            className="rounded-md border border-border bg-surface-muted p-3"
          >
            <option value="">None</option>
            {options.sourceSnapshots.map((snapshot) => (
              <option key={snapshot.id} value={snapshot.id}>
                {snapshot.id} · {snapshot.contentHash}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Textarea
        name="pointsMapping"
        label="Points Mapping JSON"
        defaultValue={JSON.stringify(regulation.pointsMapping, null, 2)}
      />
      <Textarea
        name="tieBreakRules"
        label="Tie-Break Rules JSON"
        defaultValue={JSON.stringify(regulation.tieBreakRules ?? [], null, 2)}
      />
      <Textarea name="notes" label="Notes" defaultValue={regulation.notes ?? ""} />
    </>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.45]">
        {label}
      </span>
      <span
        className={mono ? "break-all font-mono text-xs" : "break-words font-semibold"}
      >
        {value}
      </span>
    </div>
  );
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        {...props}
        className="rounded-md border border-border bg-surface-muted p-3"
      />
    </label>
  );
}

function Textarea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <textarea
        {...props}
        rows={5}
        className="rounded-md border border-border bg-surface-muted p-3 font-mono text-xs"
      />
    </label>
  );
}

function dateInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}
