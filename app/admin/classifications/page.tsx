import type { Metadata } from "next";
import Link from "next/link";
import { DataOriginStatus, ClassifiableEntityType } from "@prisma/client";
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

export default async function AdminClassificationDashboardPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const data = await getAdminClassificationDashboard(filters);

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
            Read-only operational visibility into production classification coverage. This
            dashboard never creates proposals, classifications, SourceLinks, review items,
            or DataVersion records.
          </p>
        </div>
        <AdminStatusBadge status="locked" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total records" value={data.overview.total} />
        <MetricCard label="Classified" value={data.overview.classified} />
        <MetricCard label="Unclassified" value={data.overview.unclassified} />
        <MetricCard label="Verified official" value={data.overview.verifiedOfficial} />
        <MetricCard label="Quarantined" value={data.overview.quarantined} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Source managed" value={data.overview.sourceManaged} compact />
        <MetricCard label="Audited manual" value={data.overview.auditedManual} compact />
        <MetricCard label="Demo" value={data.overview.demo} compact />
        <MetricCard label="Seed" value={data.overview.seed} compact />
        <MetricCard label="Validation" value={data.overview.validation} compact />
        <MetricCard label="Unknown" value={data.overview.unknown} compact />
        <MetricCard label="Conflicting" value={data.overview.conflicting} compact />
        <MetricCard
          label="Manual placeholder"
          value={data.overview.manualPlaceholder}
          compact
        />
        <MetricCard
          label="Archived history"
          value={data.overview.archivedHistory}
          compact
        />
        <MetricCard label="Has evidence" value={data.overview.hasEvidence} compact />
        <MetricCard
          label="Missing evidence"
          value={data.overview.missingEvidence}
          compact
        />
      </section>

      <Card className="p-5">
        <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <Select
            label="Entity type"
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
          <Select label="History" name="history" value={filters.history ?? "current"}>
            {historyFilters.map((filter) => (
              <option key={filter} value={filter}>
                {historyLabel(filter)}
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
          <button
            type="submit"
            className="h-10 rounded-md bg-accent px-4 text-sm font-black text-black"
          >
            Apply
          </button>
        </form>
      </Card>

      <Card className={adminTableCardClass}>
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-xl font-black">Entity-type breakdown</h2>
          <p className="mt-1 text-sm text-foreground/[0.58]">
            Counts reflect the selected entity type and lifecycle filters only.
          </p>
        </div>
        <div className={adminTableScrollClass}>
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
        </div>
      </Card>

      <Card className={adminTableCardClass}>
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-black">Records</h2>
            <p className="mt-1 text-sm text-foreground/[0.58]">
              {data.total} records match the current read-only filters.
            </p>
          </div>
          <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>
        <div className={adminTableScrollClass}>
          <table className={adminCompactTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeaderCellClass}>Record</th>
                <th className={adminTableHeaderCellClass}>Type</th>
                <th className={adminTableHeaderCellClass}>Classification</th>
                <th className={adminTableHeaderCellClass}>Evidence</th>
                <th className={adminTableHeaderCellClass}>History</th>
                <th className={adminTableActionCellClass}>Actions</th>
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
                    {row.classification ? (
                      <div className="mt-2 text-xs text-foreground/[0.55]">
                        {row.classification.officialWorkflowEligibility}
                      </div>
                    ) : null}
                  </td>
                  <td className={adminTableMutedCellClass}>
                    {row.classification?.hasEvidence
                      ? "Evidence attached"
                      : "No evidence attached"}
                  </td>
                  <td className={adminTableMutedCellClass}>
                    {row.historyCount > 0
                      ? `${row.historyCount} historical`
                      : "Current only"}
                  </td>
                  <td className={adminTableActionCellClass}>
                    {row.href ? (
                      <Link
                        href={row.href}
                        className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-xs font-semibold hover:border-accent"
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
                  <td className={adminTableCellClass} colSpan={6}>
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
      className="rounded-md border border-border px-3 py-2 font-semibold hover:border-accent"
    >
      {children}
    </Link>
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

function classificationLabel(filter: string) {
  return filter
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
