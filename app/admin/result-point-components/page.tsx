import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DataOriginStatus } from "@prisma/client";
import type { ScoringComponentType } from "@prisma/client";
import Link from "next/link";
import { Eye } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import {
  ClassificationBadge,
  ClassificationSummaryStrip,
} from "@/components/admin/classification-badge";
import {
  adminCompactTableClass,
  adminTableActionCellClass,
  adminTableCardClass,
  adminTableCellClass,
  adminTableHeaderCellClass,
  adminTableHeadClass,
  adminTableMutedCellClass,
  adminTablePrimaryCellClass,
  adminTableScrollClass,
} from "@/components/admin/admin-table-styles";
import { Card } from "@/components/ui/card";
import {
  getAdminResultPointComponents,
  type AdminResultPointComponentListFilters,
} from "@/db/admin-result-point-components";
import type { ClassificationFilter } from "@/lib/data-quality/record-classification";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scoring Components",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const componentTypes: ScoringComponentType[] = [
  "PROLOGUE",
  "SPRINT",
  "MAIN_EVENT",
  "FINAL",
  "OTHER",
];
const classificationFilters = [
  "ALL",
  "UNCLASSIFIED",
  DataOriginStatus.VERIFIED_OFFICIAL,
  DataOriginStatus.AUDITED_MANUAL,
  DataOriginStatus.SOURCE_MANAGED_UNVERIFIED,
  DataOriginStatus.DEMO,
  DataOriginStatus.SEED,
  DataOriginStatus.VALIDATION,
  DataOriginStatus.UNKNOWN,
  DataOriginStatus.CONFLICTING,
] as const satisfies readonly ClassificationFilter[];

export default async function AdminResultPointComponentsPage({
  searchParams,
}: PageProps) {
  const params = (await searchParams) ?? {};
  const filters = parseFilters(params);
  const data = await getAdminResultPointComponents(filters);

  return (
    <div className="grid min-w-0 gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Admin Scoring
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">Scoring Components</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Read-only foundation for official Prologue, Sprint, Main Event, and Final
            point contributions. Components explain future Result.points totals without
            changing standings behavior.
          </p>
        </div>
      </section>

      <Card className="p-5">
        <form className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_0.8fr_auto] lg:items-end">
          <FilterField label="Search" name="search" defaultValue={filters.search ?? ""} />
          <FilterSelect label="Event" name="eventId" defaultValue={filters.eventId ?? ""}>
            <option value="">All events</option>
            {data.options.events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} ({event.season.year})
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Component"
            name="componentType"
            defaultValue={filters.componentType ?? ""}
          >
            <option value="">All components</option>
            {componentTypes.map((type) => (
              <option key={type} value={type}>
                {formatEnum(type)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Regulation"
            name="regulationId"
            defaultValue={filters.regulationId ?? ""}
          >
            <option value="">All regulations</option>
            {data.options.regulations.map((regulation) => (
              <option key={regulation.id} value={regulation.id}>
                {regulation.title} v{regulation.version}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Lifecycle"
            name="lifecycle"
            defaultValue={filters.lifecycle ?? "active"}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </FilterSelect>
          <FilterSelect
            label="Classification"
            name="classification"
            defaultValue={filters.classification ?? "ALL"}
          >
            {classificationFilters.map((filter) => (
              <option key={filter} value={filter}>
                {classificationLabel(filter)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Sort" name="sort" defaultValue={filters.sort ?? ""}>
            <option value="event-desc">Newest Event</option>
            <option value="event-asc">Oldest Event</option>
            <option value="points-desc">Most Points</option>
            <option value="points-asc">Fewest Points</option>
            <option value="updated-desc">Recently Updated</option>
            <option value="updated-asc">Oldest Updated</option>
          </FilterSelect>
          <button
            type="submit"
            className="h-10 rounded-md bg-accent px-4 text-sm font-black uppercase tracking-[0.12em] text-black"
          >
            Apply
          </button>
        </form>
      </Card>

      <ClassificationSummaryStrip summary={data.classificationSummary} />

      <Card className={adminTableCardClass}>
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Component rows</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            {data.total} scoring component{data.total === 1 ? "" : "s"} found.
          </p>
        </div>
        <div className={adminTableScrollClass}>
          <table className={adminCompactTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTablePrimaryCellClass}>Component</th>
                <th className={adminTableHeaderCellClass}>Result</th>
                <th className={adminTableHeaderCellClass}>Stage</th>
                <th className={adminTableHeaderCellClass}>Points</th>
                <th className={adminTableHeaderCellClass}>Regulation</th>
                <th className={adminTableHeaderCellClass}>Source</th>
                <th className={adminTableHeaderCellClass}>Classification</th>
                <th className={adminTableHeaderCellClass}>Updated</th>
                <th className={adminTableActionCellClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.components.map((component) => {
                const riderName = `${component.result.rider.firstName} ${component.result.rider.lastName}`;
                return (
                  <tr key={component.id} className="border-t border-border">
                    <td className={adminTablePrimaryCellClass}>
                      <div className="font-semibold">
                        {formatEnum(component.componentType)}
                      </div>
                      <div className="mt-1 text-xs text-foreground/[0.48]">
                        {component.classificationScope} ·{" "}
                        {component.className ?? "Overall"}
                      </div>
                    </td>
                    <td className={adminTableCellClass}>
                      <div className="font-semibold">{riderName}</div>
                      <div className="mt-1 text-xs text-foreground/[0.48]">
                        {component.result.event.name}
                      </div>
                    </td>
                    <td className={adminTableMutedCellClass}>
                      {component.raceStage?.name ??
                        component.stageResult?.stage.name ??
                        "No stage link"}
                    </td>
                    <td className={adminTableCellClass}>
                      <span className="font-black text-accent">{component.points}</span>
                      <span className="ml-2 text-xs text-foreground/[0.48]">
                        P{component.position ?? "TBC"}
                      </span>
                    </td>
                    <td className={adminTableMutedCellClass}>
                      {component.regulationTableKey}
                    </td>
                    <td className={adminTableCellClass}>
                      <AdminStatusBadge
                        status={component.sourceLinks.length ? "ready" : "placeholder"}
                      />
                    </td>
                    <td className={adminTableCellClass}>
                      <ClassificationBadge resolution={component.classification} />
                    </td>
                    <td className={adminTableCellClass}>
                      {formatDate(component.updatedAt)}
                    </td>
                    <td className={adminTableActionCellClass}>
                      <Link
                        href={`/admin/result-point-components/${component.id}`}
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface-muted px-3 text-xs font-semibold transition hover:border-accent hover:text-accent"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data.components.length === 0 ? (
          <div className="border-t border-border p-6 text-sm text-foreground/[0.62]">
            No scoring components exist yet. Future approved regulation workflows will
            create rows here.
          </div>
        ) : null}
      </Card>

      <Pagination page={data.page} totalPages={data.totalPages} filters={filters} />
    </div>
  );
}

function parseFilters(
  params: Record<string, string | string[] | undefined>,
): AdminResultPointComponentListFilters {
  return {
    search: value(params, "search"),
    eventId: value(params, "eventId"),
    componentType: parseComponentType(value(params, "componentType")),
    regulationId: value(params, "regulationId"),
    classification: parseClassificationFilter(value(params, "classification")),
    lifecycle: parseLifecycle(value(params, "lifecycle")),
    sort: value(params, "sort"),
    page: Number(value(params, "page") ?? "1"),
  };
}

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

function parseComponentType(value?: string): ScoringComponentType | undefined {
  return componentTypes.includes(value as ScoringComponentType)
    ? (value as ScoringComponentType)
    : undefined;
}

function parseLifecycle(value?: string) {
  if (value === "archived" || value === "all") return value;
  return "active";
}

function parseClassificationFilter(value?: string): ClassificationFilter | undefined {
  return classificationFilters.includes(value as (typeof classificationFilters)[number])
    ? (value as ClassificationFilter)
    : undefined;
}

function Pagination({
  page,
  totalPages,
  filters,
}: {
  page: number;
  totalPages: number;
  filters: AdminResultPointComponentListFilters;
}) {
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    Object.entries({ ...filters, page: nextPage }).forEach(([key, raw]) => {
      if (raw !== undefined && raw !== "" && raw !== null) {
        params.set(key, String(raw));
      }
    });
    return `/admin/result-point-components?${params.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-foreground/[0.58]">
        Page {page} of {Math.max(totalPages, 1)}
      </p>
      <div className="flex gap-2">
        {page <= 1 ? (
          <span className="rounded-md border border-border px-4 py-2 text-sm text-foreground/[0.4]">
            Previous
          </span>
        ) : (
          <Link
            href={hrefFor(page - 1)}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            Previous
          </Link>
        )}
        {page >= totalPages ? (
          <span className="rounded-md border border-border px-4 py-2 text-sm text-foreground/[0.4]">
            Next
          </span>
        ) : (
          <Link
            href={hrefFor(page + 1)}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

function FilterField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.54]">
        {label}
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
      />
    </label>
  );
}

function FilterSelect({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.54]">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
      >
        {children}
      </select>
    </label>
  );
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function classificationLabel(filter: string) {
  if (filter === "ALL") return "All";
  if (filter === "UNCLASSIFIED") return "Unclassified";
  return formatEnum(filter);
}
