import type { Metadata } from "next";
import Link from "next/link";
import { ClassifiableEntityType, DataOriginStatus } from "@prisma/client";
import { Eye, ShieldCheck } from "lucide-react";

import {
  adminCompactTableClass,
  adminTableActionCellClass,
  adminTableCardClass,
  adminTableCellClass,
  adminTableHeadClass,
  adminTableHeaderCellClass,
  adminTableMutedCellClass,
  adminTablePrimaryCellClass,
  adminTableScrollClass,
} from "@/components/admin/admin-table-styles";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ClassificationBadge } from "@/components/admin/classification-badge";
import { Card } from "@/components/ui/card";
import {
  entityTypeLabel,
  getAdminClassificationDashboard,
  type AdminClassificationDashboardFilters,
  type ClassificationEntityLifecycleFilter,
  type ClassificationEvidenceFilter,
  type ClassificationHistoryFilter,
} from "@/db/admin-classifications";
import { parseAdminPage } from "@/lib/admin/platform";
import { generateClassificationReadinessReport } from "@/lib/data-quality/classification-intelligence";
import type { ClassificationCandidateState } from "@/lib/data-quality/record-classification-candidates";
import {
  classifiableEntityTypes,
  type ClassificationFilter,
} from "@/lib/data-quality/record-classification";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Classification Dashboard",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type CandidateRow = Awaited<
  ReturnType<typeof generateClassificationReadinessReport>
>["rows"][number];

type CandidateStatusFilter =
  | "all"
  | "ready"
  | "missing-evidence"
  | "needs-review"
  | "blocked"
  | "conflicts";

const classificationFilters = [
  "ALL",
  "UNCLASSIFIED",
  DataOriginStatus.VERIFIED_OFFICIAL,
  DataOriginStatus.SOURCE_MANAGED_UNVERIFIED,
  DataOriginStatus.AUDITED_MANUAL,
  DataOriginStatus.MANUAL_PLACEHOLDER,
  DataOriginStatus.DEMO,
  DataOriginStatus.SEED,
  DataOriginStatus.VALIDATION,
  DataOriginStatus.UNKNOWN,
  DataOriginStatus.CONFLICTING,
  DataOriginStatus.ARCHIVED_HISTORY,
] as const satisfies readonly ClassificationFilter[];

const evidenceFilters: ClassificationEvidenceFilter[] = [
  "all",
  "has-evidence",
  "missing-evidence",
];
const historyFilters: ClassificationHistoryFilter[] = [
  "current",
  "with-history",
  "archived-history",
];
const lifecycleFilters: ClassificationEntityLifecycleFilter[] = ["all", "active"];
const candidateStatusFilters: CandidateStatusFilter[] = [
  "all",
  "ready",
  "missing-evidence",
  "needs-review",
  "blocked",
  "conflicts",
];
const actionNeededStates: ClassificationCandidateState[] = [
  "READY_FOR_PROPOSAL",
  "REVIEW_REQUIRED",
  "BLOCKED",
  "NO_CANDIDATE",
  "UNSUPPORTED_EVIDENCE_PATH",
  "STALE",
];
const tableScrollStyle = { overflowX: "auto" } as const;

export default async function AdminClassificationDashboardPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const candidateStatus = parseCandidateStatusFilter(value(params, "status"));
  const data = await getAdminClassificationDashboard(filters);
  const intelligence = await generateClassificationReadinessReport();
  const actionRows = filterActionNeededRows(intelligence.rows, candidateStatus).slice(
    0,
    25,
  );
  const events2026Href = classificationHref({
    entityType: ClassifiableEntityType.EVENT,
    classification: filters.classification,
    evidence: filters.evidence,
    entityLifecycle: filters.entityLifecycle,
    history: filters.history,
    status: candidateStatus,
  });

  return (
    <div className="grid min-w-0 gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Admin Classifications
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">
            Classification dashboard
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Read-only operational visibility into production classification coverage. Use
            this page to find records that are ready, missing evidence, or need review.
          </p>
        </div>
        <AdminStatusBadge status="ready" />
      </section>

      <section
        aria-label="Classification summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"
      >
        <MetricCard label="Total Records" value={data.overview.total} />
        <MetricCard label="Ready" value={intelligence.overview.readyForProposal} />
        <MetricCard label="Missing Evidence" value={intelligence.overview.noCandidate} />
        <MetricCard label="Needs Review" value={intelligence.overview.reviewRequired} />
        <MetricCard label="Conflicts" value={intelligence.conflicts.length} />
        <MetricCard label="Classified" value={data.overview.classified} />
      </section>

      <Card className="p-5">
        <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <Select
            label="Entity Type"
            name="entityType"
            value={filters.entityType ?? "ALL"}
          >
            <option value="ALL">All entity types</option>
            {classifiableEntityTypes.map((entityType) => (
              <option key={entityType} value={entityType}>
                {entityTypeLabel(entityType)}
              </option>
            ))}
          </Select>
          <Select
            label="Classification"
            name="classification"
            value={filters.classification ?? "ALL"}
          >
            {classificationFilters.map((filter) => (
              <option key={filter} value={filter}>
                {classificationLabel(filter)}
              </option>
            ))}
          </Select>
          <Select label="Status" name="status" value={candidateStatus}>
            {candidateStatusFilters.map((filter) => (
              <option key={filter} value={filter}>
                {candidateStatusFilterLabel(filter)}
              </option>
            ))}
          </Select>
          <Select label="Evidence" name="evidence" value={filters.evidence ?? "all"}>
            {evidenceFilters.map((filter) => (
              <option key={filter} value={filter}>
                {evidenceLabel(filter)}
              </option>
            ))}
          </Select>
          <Select
            label="Lifecycle"
            name="entityLifecycle"
            value={filters.entityLifecycle ?? "all"}
          >
            {lifecycleFilters.map((filter) => (
              <option key={filter} value={filter}>
                {lifecycleLabel(filter)}
              </option>
            ))}
          </Select>
          <button
            type="submit"
            className="h-10 rounded-md bg-accent px-4 text-sm font-black text-black focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
          >
            Apply
          </button>
          <details className="lg:col-span-6">
            <summary className="cursor-pointer text-sm font-bold text-foreground/[0.72] focus:outline-none focus:ring-2 focus:ring-accent">
              More filters
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select label="History" name="history" value={filters.history ?? "current"}>
                {historyFilters.map((filter) => (
                  <option key={filter} value={filter}>
                    {historyLabel(filter)}
                  </option>
                ))}
              </Select>
            </div>
          </details>
        </form>
      </Card>

      <Card className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black">2026 Events</h2>
            <p className="mt-1 text-sm text-foreground/[0.58]">
              {intelligence.events2026.summary.readyForProposal} ready,{" "}
              {intelligence.events2026.summary.noCandidate} missing evidence,{" "}
              {intelligence.events2026.summary.reviewRequired} need review,{" "}
              {intelligence.events2026.summary.blocked} blocked.
            </p>
          </div>
          <Link
            href={events2026Href}
            className="inline-flex w-fit items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
          >
            View 2026 Events ({intelligence.events2026.summary.total})
          </Link>
        </div>
      </Card>

      <Card className={adminTableCardClass}>
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-xl font-black">Action Needed</h2>
          <p className="mt-1 text-sm text-foreground/[0.58]">
            Records ready for a proposal or missing evidence. Open a record to inspect the
            full candidate audit.
          </p>
        </div>
        <div className={adminTableScrollClass} style={tableScrollStyle}>
          <table className={adminCompactTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeaderCellClass}>Record</th>
                <th className={adminTableHeaderCellClass}>Suggested</th>
                <th className={adminTableHeaderCellClass}>Status</th>
                <th className={adminTableActionCellClass}>Action</th>
              </tr>
            </thead>
            <tbody>
              {actionRows.map((candidate) => (
                <tr
                  key={`${candidate.entityType}-${candidate.entityId}`}
                  className="border-t border-border"
                >
                  <td className={adminTablePrimaryCellClass}>
                    <div className="font-semibold">
                      {candidate.entityLabel ?? candidate.entityId}
                    </div>
                    <div className="mt-1 text-xs text-foreground/[0.52]">
                      {entityTypeLabel(candidate.entityType)} ·{" "}
                      {candidatePrimaryIssue(candidate)}
                    </div>
                  </td>
                  <td className={adminTableCellClass}>
                    {candidate.suggestedStatus ? (
                      <ClassificationBadge status={candidate.suggestedStatus} />
                    ) : (
                      <span className="text-sm text-foreground/[0.58]">
                        No suggestion
                      </span>
                    )}
                  </td>
                  <td className={adminTableCellClass}>
                    {candidateStateLabel(candidate.candidateState)}
                  </td>
                  <td className={adminTableActionCellClass}>
                    <CandidateActionLink candidate={candidate} />
                  </td>
                </tr>
              ))}
              {actionRows.length === 0 ? (
                <tr>
                  <td className={adminTableCellClass} colSpan={4}>
                    No records currently need action for these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className={adminTableCardClass}>
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-black">All Records</h2>
            <p className="mt-1 text-sm text-foreground/[0.58]">
              {data.total} records match the current read-only filters.
            </p>
          </div>
          <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>
        <div className={adminTableScrollClass} style={tableScrollStyle}>
          <table className={adminCompactTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeaderCellClass}>Record</th>
                <th className={adminTableHeaderCellClass}>Type</th>
                <th className={adminTableHeaderCellClass}>Classification</th>
                <th className={adminTableHeaderCellClass}>Evidence</th>
                <th className={adminTableActionCellClass}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr
                  key={`${row.entityType}-${row.entityId}`}
                  className="border-t border-border"
                >
                  <td className={adminTablePrimaryCellClass}>
                    <div className="font-semibold">{row.label}</div>
                    <div className="mt-1 text-xs text-foreground/[0.52]">
                      {row.detail ?? row.entityId}
                    </div>
                    {row.archived ? (
                      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-yellow-300">
                        Archived entity
                      </div>
                    ) : null}
                  </td>
                  <td className={adminTableCellClass}>
                    {entityTypeLabel(row.entityType)}
                  </td>
                  <td className={adminTableCellClass}>
                    <ClassificationBadge
                      status={row.classification?.originStatus ?? "UNCLASSIFIED"}
                    />
                  </td>
                  <td className={adminTableMutedCellClass}>
                    {row.classification?.hasEvidence ? "Has evidence" : "No evidence"}
                  </td>
                  <td className={adminTableActionCellClass}>
                    {row.href ? (
                      <Link
                        href={row.href}
                        className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-xs font-semibold hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        Open
                      </Link>
                    ) : (
                      <span className="text-xs text-foreground/[0.45]">No detail</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.rows.length === 0 ? (
                <tr>
                  <td className={adminTableCellClass} colSpan={5}>
                    No records match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-sm text-foreground/[0.62] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {data.page} of {data.totalPages}
          </span>
          <div className="flex gap-2">
            <PaginationLink
              params={params}
              page={data.page - 1}
              disabled={data.page <= 1}
            >
              Previous
            </PaginationLink>
            <PaginationLink
              params={params}
              page={data.page + 1}
              disabled={data.page >= data.totalPages}
            >
              Next
            </PaginationLink>
          </div>
        </div>
      </Card>

      <details className="rounded-md border border-border bg-card">
        <summary className="cursor-pointer px-5 py-4 text-lg font-black focus:outline-none focus:ring-2 focus:ring-accent">
          Advanced diagnostics
        </summary>
        <div className="grid gap-5 border-t border-border p-5">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard
              label="Source Managed"
              value={data.overview.sourceManaged}
              compact
            />
            <MetricCard
              label="Audited Manual"
              value={data.overview.auditedManual}
              compact
            />
            <MetricCard label="Demo" value={data.overview.demo} compact />
            <MetricCard label="Seed" value={data.overview.seed} compact />
            <MetricCard label="Validation" value={data.overview.validation} compact />
            <MetricCard label="Unknown" value={data.overview.unknown} compact />
            <MetricCard
              label="Manual Placeholder"
              value={data.overview.manualPlaceholder}
              compact
            />
            <MetricCard
              label="Archived History"
              value={data.overview.archivedHistory}
              compact
            />
            <MetricCard
              label="No Change"
              value={intelligence.overview.noChange}
              compact
            />
            <MetricCard
              label="Unsupported Path"
              value={intelligence.overview.unsupportedEvidencePath}
              compact
            />
            <MetricCard
              label="Archived Entity"
              value={intelligence.overview.archivedEntity}
              compact
            />
            <MetricCard label="Has Evidence" value={data.overview.hasEvidence} compact />
          </section>

          <DiagnosticsTable
            title="Full readiness breakdown"
            description="Counts reflect the selected entity type and lifecycle filters only."
          >
            <table className={adminCompactTableClass}>
              <thead className={adminTableHeadClass}>
                <tr>
                  <th className={adminTableHeaderCellClass}>Entity Type</th>
                  <th className={adminTableHeaderCellClass}>Total</th>
                  <th className={adminTableHeaderCellClass}>Classified</th>
                  <th className={adminTableHeaderCellClass}>Unclassified</th>
                  <th className={adminTableHeaderCellClass}>Verified</th>
                  <th className={adminTableHeaderCellClass}>Quarantined</th>
                  <th className={adminTableHeaderCellClass}>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {data.breakdown.map((row) => (
                  <tr key={row.entityType} className="border-t border-border">
                    <td className={adminTablePrimaryCellClass}>{row.label}</td>
                    <td className={adminTableCellClass}>{row.total}</td>
                    <td className={adminTableCellClass}>{row.classified}</td>
                    <td className={adminTableCellClass}>{row.unclassified}</td>
                    <td className={adminTableCellClass}>{row.verifiedOfficial}</td>
                    <td className={adminTableCellClass}>{row.quarantined}</td>
                    <td className={adminTableMutedCellClass}>
                      {row.hasEvidence} attached / {row.missingEvidence} missing
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DiagnosticsTable>

          <DiagnosticsTable
            title="Entity Coverage"
            description="Adapter, proposal, detail-route and review support for every classifiable entity type."
          >
            <table className={adminCompactTableClass}>
              <thead className={adminTableHeadClass}>
                <tr>
                  <th className={adminTableHeaderCellClass}>Entity Type</th>
                  <th className={adminTableHeaderCellClass}>Analysis</th>
                  <th className={adminTableHeaderCellClass}>Proposal</th>
                  <th className={adminTableHeaderCellClass}>Detail</th>
                  <th className={adminTableHeaderCellClass}>Review Evidence</th>
                </tr>
              </thead>
              <tbody>
                {intelligence.capabilityMatrix.map((adapter) => (
                  <tr key={adapter.entityType} className="border-t border-border">
                    <td className={adminTablePrimaryCellClass}>{adapter.label}</td>
                    <td className={adminTableCellClass}>
                      {capabilityLabel(adapter.analysisSupport)}
                    </td>
                    <td className={adminTableCellClass}>
                      {capabilityLabel(adapter.proposalSupport)}
                    </td>
                    <td className={adminTableCellClass}>
                      {capabilityLabel(adapter.detailRouteSupport)}
                    </td>
                    <td className={adminTableCellClass}>
                      {capabilityLabel(adapter.supportingReviewSupport)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DiagnosticsTable>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-xl font-black">Conflict diagnostics</h2>
              <p className="mt-2 text-sm text-foreground/[0.58]">
                {intelligence.conflicts.length} material conflict candidates detected.
              </p>
              <CandidateMiniList rows={intelligence.conflicts.slice(0, 8)} />
            </Card>
            <Card className="p-5">
              <h2 className="text-xl font-black">Detailed missing-evidence counts</h2>
              <div className="mt-4 grid gap-2">
                {intelligence.missingEvidence.map((item) => (
                  <div
                    key={item.requirement}
                    className="flex justify-between gap-3 border-b border-border pb-2 text-sm"
                  >
                    <span>{item.requirement}</span>
                    <span className="font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </details>
    </div>
  );
}

function MetricCard({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: number;
  compact?: boolean;
}) {
  return (
    <Card className={compact ? "p-4" : "p-5"}>
      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-foreground/[0.52]">
        {label}
      </div>
      <div className={compact ? "mt-2 text-2xl font-black" : "mt-3 text-3xl font-black"}>
        {value}
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/[0.52]">
      {label}
      {children}
    </label>
  );
}

function Select({
  label,
  name,
  value,
  children,
}: {
  label: string;
  name: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Field label={label}>
      <select
        name={name}
        defaultValue={value}
        className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm normal-case tracking-normal text-foreground"
      >
        {children}
      </select>
    </Field>
  );
}

function CandidateActionLink({ candidate }: { candidate: CandidateRow }) {
  const label =
    candidate.candidateState === "READY_FOR_PROPOSAL"
      ? "Review"
      : candidate.candidateState === "BLOCKED" ||
          candidate.candidateState === "UNSUPPORTED_EVIDENCE_PATH"
        ? "Resolve"
        : "Inspect";

  return (
    <Link
      href={`/admin/classifications/candidates/${candidate.entityType}/${candidate.entityId}`}
      className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-xs font-semibold hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
    >
      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </Link>
  );
}

function CandidateMiniList({ rows }: { rows: CandidateRow[] }) {
  if (!rows.length) {
    return <p className="mt-3 text-sm text-foreground/[0.58]">No records found.</p>;
  }

  return (
    <div className="mt-4 grid gap-3">
      {rows.map((row) => (
        <Link
          key={`${row.entityType}-${row.entityId}`}
          href={`/admin/classifications/candidates/${row.entityType}/${row.entityId}`}
          className="rounded-md border border-border bg-card p-3 text-sm transition hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{row.entityLabel ?? row.entityId}</span>
            <span className="text-xs text-foreground/[0.58]">
              {candidateStateLabel(row.candidateState)}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-xs text-foreground/[0.56]">{row.reason}</p>
        </Link>
      ))}
    </div>
  );
}

function DiagnosticsTable({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={adminTableCardClass}>
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-xl font-black">{title}</h2>
        <p className="mt-1 text-sm text-foreground/[0.58]">{description}</p>
      </div>
      <div className={adminTableScrollClass} style={tableScrollStyle}>
        {children}
      </div>
    </Card>
  );
}

function PaginationLink({
  params,
  page,
  disabled,
  children,
}: {
  params?: Record<string, string | string[] | undefined>;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="rounded-md border border-border px-3 py-2 text-foreground/[0.34]">
        {children}
      </span>
    );
  }

  const nextParams = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(params ?? {})) {
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value && key !== "page") nextParams.set(key, value);
  }
  nextParams.set("page", String(page));

  return (
    <Link
      href={`/admin/classifications?${nextParams.toString()}`}
      className="rounded-md border border-border px-3 py-2 font-semibold hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
    >
      {children}
    </Link>
  );
}

function filterActionNeededRows(
  rows: CandidateRow[],
  statusFilter: CandidateStatusFilter,
) {
  return rows.filter((row) => {
    const needsAction =
      actionNeededStates.includes(row.candidateState) ||
      row.suggestedStatus === DataOriginStatus.CONFLICTING;
    if (!needsAction) return false;
    if (statusFilter === "all") return true;
    if (statusFilter === "ready") return row.candidateState === "READY_FOR_PROPOSAL";
    if (statusFilter === "missing-evidence") return row.candidateState === "NO_CANDIDATE";
    if (statusFilter === "needs-review") return row.candidateState === "REVIEW_REQUIRED";
    if (statusFilter === "blocked") return row.candidateState === "BLOCKED";
    return row.suggestedStatus === DataOriginStatus.CONFLICTING;
  });
}

function candidatePrimaryIssue(candidate: CandidateRow) {
  return (
    candidate.blockingIssues[0] ??
    candidate.missingEvidence[0] ??
    candidate.warnings[0] ??
    candidate.reason
  );
}

function parseFilters(
  params?: Record<string, string | string[] | undefined>,
): AdminClassificationDashboardFilters {
  return {
    entityType: parseEntityType(value(params, "entityType")),
    classification: parseClassificationFilter(value(params, "classification")),
    entityLifecycle: parseLifecycleFilter(value(params, "entityLifecycle")),
    history: parseHistoryFilter(value(params, "history")),
    evidence: parseEvidenceFilter(value(params, "evidence")),
    page: parseAdminPage(value(params, "page")),
  };
}

function value(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const raw = params?.[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

function parseEntityType(value: string | undefined) {
  if (!value || value === "ALL") return "ALL";
  return classifiableEntityTypes.includes(value as ClassifiableEntityType)
    ? (value as ClassifiableEntityType)
    : "ALL";
}

function parseClassificationFilter(value: string | undefined): ClassificationFilter {
  return classificationFilters.includes(value as (typeof classificationFilters)[number])
    ? (value as ClassificationFilter)
    : "ALL";
}

function parseCandidateStatusFilter(value: string | undefined): CandidateStatusFilter {
  return candidateStatusFilters.includes(value as CandidateStatusFilter)
    ? (value as CandidateStatusFilter)
    : "all";
}

function parseLifecycleFilter(
  value: string | undefined,
): ClassificationEntityLifecycleFilter {
  return lifecycleFilters.includes(value as ClassificationEntityLifecycleFilter)
    ? (value as ClassificationEntityLifecycleFilter)
    : "all";
}

function parseHistoryFilter(value: string | undefined): ClassificationHistoryFilter {
  return historyFilters.includes(value as ClassificationHistoryFilter)
    ? (value as ClassificationHistoryFilter)
    : "current";
}

function parseEvidenceFilter(value: string | undefined): ClassificationEvidenceFilter {
  return evidenceFilters.includes(value as ClassificationEvidenceFilter)
    ? (value as ClassificationEvidenceFilter)
    : "all";
}

function classificationHref({
  entityType,
  classification,
  evidence,
  entityLifecycle,
  history,
  status,
}: {
  entityType: ClassifiableEntityType | "ALL";
  classification?: ClassificationFilter;
  evidence?: ClassificationEvidenceFilter;
  entityLifecycle?: ClassificationEntityLifecycleFilter;
  history?: ClassificationHistoryFilter;
  status?: CandidateStatusFilter;
}) {
  const params = new URLSearchParams();
  if (entityType !== "ALL") params.set("entityType", entityType);
  if (classification && classification !== "ALL") {
    params.set("classification", classification);
  }
  if (evidence && evidence !== "all") params.set("evidence", evidence);
  if (entityLifecycle && entityLifecycle !== "all") {
    params.set("entityLifecycle", entityLifecycle);
  }
  if (history && history !== "current") params.set("history", history);
  if (status && status !== "all") params.set("status", status);
  const query = params.toString();
  return query ? `/admin/classifications?${query}` : "/admin/classifications";
}

function classificationLabel(filter: string) {
  const labels: Record<string, string> = {
    ALL: "All classifications",
    UNCLASSIFIED: "Unclassified",
    VERIFIED_OFFICIAL: "Verified official",
    SOURCE_MANAGED_UNVERIFIED: "Source managed",
    AUDITED_MANUAL: "Audited manual",
    MANUAL_PLACEHOLDER: "Manual placeholder",
    DEMO: "Demo",
    SEED: "Seed",
    VALIDATION: "Validation",
    UNKNOWN: "Unknown",
    CONFLICTING: "Conflict",
    ARCHIVED_HISTORY: "Archived history",
  };
  return labels[filter] ?? filter;
}

function candidateStatusFilterLabel(filter: CandidateStatusFilter) {
  if (filter === "ready") return "Ready";
  if (filter === "missing-evidence") return "Missing evidence";
  if (filter === "needs-review") return "Needs review";
  if (filter === "blocked") return "Blocked";
  if (filter === "conflicts") return "Conflicts";
  return "All statuses";
}

function candidateStateLabel(state: ClassificationCandidateState) {
  const labels: Record<ClassificationCandidateState, string> = {
    READY_FOR_PROPOSAL: "Ready",
    REVIEW_REQUIRED: "Needs Review",
    BLOCKED: "Blocked",
    NO_CANDIDATE: "Missing Evidence",
    NO_CHANGE: "No Change",
    ARCHIVED_ENTITY: "Archived Entity",
    UNSUPPORTED_EVIDENCE_PATH: "Evidence path not available",
    STALE: "Stale",
  };
  return labels[state];
}

function capabilityLabel(value: string) {
  const labels: Record<string, string> = {
    SUPPORTED_FOR_ANALYSIS: "Analysis available",
    SUPPORTED_FOR_PROPOSAL: "Proposal available",
    READINESS_ONLY: "Read-only",
  };
  return labels[value] ?? value;
}

function lifecycleLabel(filter: ClassificationEntityLifecycleFilter) {
  if (filter === "active") return "Active only";
  return "All records";
}

function historyLabel(filter: ClassificationHistoryFilter) {
  if (filter === "with-history") return "Has history";
  if (filter === "archived-history") return "Archived history";
  return "Current state";
}

function evidenceLabel(filter: ClassificationEvidenceFilter) {
  if (filter === "has-evidence") return "Has evidence";
  if (filter === "missing-evidence") return "Missing evidence";
  return "All evidence states";
}
