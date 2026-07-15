import type { Metadata } from "next";
import Link from "next/link";
import { Eye } from "lucide-react";
import type { ResultStatus } from "@prisma/client";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
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
import { EventAlert } from "@/components/admin/events/event-alert";
import { Card } from "@/components/ui/card";
import {
  getAdminStageResults,
  type AdminStageResultListFilters,
  type ResultLifecycleFilter,
  type SourceModeFilter,
} from "@/db/admin-results";
import { resultStatuses } from "@/lib/admin/result-cms";
import { parseAdminPage } from "@/lib/admin/platform";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stage Results CMS",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const lifecycles: ResultLifecycleFilter[] = ["active", "archived", "all"];
const sourceModes: SourceModeFilter[] = ["all", "source-managed", "manual"];

export default async function AdminStageResultsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const data = await getAdminStageResults(filters);

  return (
    <div className="grid min-w-0 gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Admin Stage Results
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">Stage Results CMS</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Manage persisted stage-level classifications without recalculating overall
            results, standings, points, statistics, or records.
          </p>
        </div>
        <AdminStatusBadge status="ready" />
      </section>

      <StageResultMessage code={value(params, "error") ?? value(params, "saved")} />

      <Card className="p-5">
        <form className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_0.7fr_0.8fr_1fr_1fr_1fr_auto] lg:items-end">
          <Field label="Search">
            <input
              name="search"
              defaultValue={filters.search ?? ""}
              placeholder="Event, stage, rider, class"
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            />
          </Field>
          <Select name="eventId" label="Event" value={filters.eventId ?? ""}>
            <option value="">All events</option>
            {data.options.events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} {event.season ? `(${event.season.year})` : ""}
              </option>
            ))}
          </Select>
          <Select name="stageId" label="Stage" value={filters.stageId ?? ""}>
            <option value="">All stages</option>
            {data.options.stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.event.name}: {stage.stageOrder}. {stage.name}
              </option>
            ))}
          </Select>
          <Select name="riderId" label="Rider" value={filters.riderId ?? ""}>
            <option value="">All riders</option>
            {data.options.riders.map((rider) => (
              <option key={rider.id} value={rider.id}>
                {rider.firstName} {rider.lastName}
              </option>
            ))}
          </Select>
          <Field label="Position">
            <input
              name="position"
              type="number"
              min="1"
              defaultValue={filters.position ? String(filters.position) : ""}
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            />
          </Field>
          <Select name="status" label="Status" value={filters.status ?? ""}>
            <option value="">All</option>
            {resultStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Select name="sourceMode" label="Source" value={filters.sourceMode ?? "all"}>
            {sourceModes.map((mode) => (
              <option key={mode} value={mode}>
                {sourceLabel(mode)}
              </option>
            ))}
          </Select>
          <Select
            name="lifecycle"
            label="Lifecycle"
            value={filters.lifecycle ?? "active"}
          >
            {lifecycles.map((lifecycle) => (
              <option key={lifecycle} value={lifecycle}>
                {lifecycle}
              </option>
            ))}
          </Select>
          <Select name="sort" label="Sort" value={filters.sort ?? "stage-desc"}>
            <option value="stage-desc">Event date ↓</option>
            <option value="stage-asc">Event date ↑</option>
            <option value="position-asc">Position ↑</option>
            <option value="position-desc">Position ↓</option>
            <option value="updated-desc">Updated ↓</option>
            <option value="updated-asc">Updated ↑</option>
          </Select>
          <button
            type="submit"
            className="h-10 rounded-md bg-accent px-4 text-sm font-black uppercase tracking-[0.12em] text-black"
          >
            Apply
          </button>
        </form>
      </Card>

      <Card className={adminTableCardClass}>
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Stage classifications</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            {data.total} stage results found. Page {data.page} of {data.totalPages}.
          </p>
        </div>
        <div className={adminTableScrollClass}>
          <table className={adminCompactTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTablePrimaryCellClass}>Stage result</th>
                <th className={adminTableHeaderCellClass}>Event / Stage</th>
                <th className={adminTableHeaderCellClass}>Status</th>
                <th className={adminTableHeaderCellClass}>Time</th>
                <th className={adminTableHeaderCellClass}>Equipment</th>
                <th className={adminTableHeaderCellClass}>Source</th>
                <th className={adminTableHeaderCellClass}>Updated</th>
                <th className={adminTableActionCellClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.stageResults.map((result) => (
                <tr key={result.id} className="border-t border-border">
                  <td className={adminTablePrimaryCellClass}>
                    <div className="font-semibold">
                      {positionLabel(result.overallPosition)} {result.rider.firstName}{" "}
                      {result.rider.lastName}
                    </div>
                    <div className="mt-1 text-xs text-foreground/[0.48]">
                      Class {result.className ?? "Overall"}
                    </div>
                  </td>
                  <td className={adminTableCellClass}>
                    <div>{result.stage.event.name}</div>
                    <div className="mt-1 text-xs text-foreground/[0.48]">
                      {result.stage.stageOrder}. {result.stage.name}
                    </div>
                  </td>
                  <td className={adminTableCellClass}>
                    {result.archivedAt ? "ARCHIVED" : result.status}
                  </td>
                  <td className={adminTableMutedCellClass}>
                    {result.totalTimeText ?? "Not recorded"}
                  </td>
                  <td className={adminTableMutedCellClass}>
                    {result.manufacturer?.name ??
                      result.motorcycle?.manufacturer.name ??
                      "Unassigned"}
                  </td>
                  <td className={adminTableCellClass}>
                    {result.sourceLinks.length ? "Source-managed" : "Manual"}
                  </td>
                  <td className={adminTableCellClass}>{formatDate(result.updatedAt)}</td>
                  <td className={adminTableActionCellClass}>
                    <Link
                      href={`/admin/stage-results/${result.id}`}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface-muted px-3 text-xs font-semibold transition hover:border-accent hover:text-accent"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.stageResults.length === 0 ? (
          <div className="border-t border-border p-6 text-sm text-foreground/[0.62]">
            No stage results match the current filters.
          </div>
        ) : null}
      </Card>

      <Pagination filters={filters} current={data.page} totalPages={data.totalPages} />
    </div>
  );
}

function parseFilters(
  params: Record<string, string | string[] | undefined> | undefined,
): AdminStageResultListFilters {
  const status = value(params, "status");
  const lifecycle = value(params, "lifecycle");
  const sourceMode = value(params, "sourceMode");
  const position = value(params, "position");
  return {
    search: value(params, "search"),
    eventId: value(params, "eventId"),
    stageId: value(params, "stageId"),
    riderId: value(params, "riderId"),
    status: isStatus(status) ? status : undefined,
    position:
      position && Number.isInteger(Number(position)) ? Number(position) : undefined,
    sourceMode: isSourceMode(sourceMode) ? sourceMode : "all",
    lifecycle: isLifecycle(lifecycle) ? lifecycle : "active",
    page: parseAdminPage(value(params, "page")),
    sort: value(params, "sort") ?? "stage-desc",
  };
}

function Pagination({
  filters,
  current,
  totalPages,
}: {
  filters: AdminStageResultListFilters;
  current: number;
  totalPages: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-foreground/[0.58]">
        Page {current} of {totalPages}
      </p>
      <div className="flex gap-2">
        <PageLink disabled={current <= 1} page={current - 1} filters={filters}>
          Previous
        </PageLink>
        <PageLink disabled={current >= totalPages} page={current + 1} filters={filters}>
          Next
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  disabled,
  page,
  filters,
  children,
}: {
  disabled: boolean;
  page: number;
  filters: AdminStageResultListFilters;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries({ ...filters, page })) {
    if (rawValue !== undefined && rawValue !== "") params.set(key, String(rawValue));
  }
  return disabled ? (
    <span className="rounded-md border border-border px-4 py-2 text-sm text-foreground/[0.4]">
      {children}
    </span>
  ) : (
    <Link
      href={`/admin/stage-results?${params.toString()}`}
      className="rounded-md border border-border px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
    >
      {children}
    </Link>
  );
}

function Select({
  name,
  label,
  value,
  children,
}: {
  name: string;
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Field label={label}>
      <select
        name={name}
        defaultValue={value}
        className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
      >
        {children}
      </select>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.54]">
        {label}
      </span>
      {children}
    </label>
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
    <EventAlert tone={code === "updated" ? "success" : "error"}>
      {messages[code] ?? code}
    </EventAlert>
  );
}

function value(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const raw = params?.[key];
  return typeof raw === "string" ? raw : undefined;
}

function isStatus(value?: string): value is ResultStatus {
  return resultStatuses.includes(value as ResultStatus);
}

function isLifecycle(value?: string): value is ResultLifecycleFilter {
  return lifecycles.includes(value as ResultLifecycleFilter);
}

function isSourceMode(value?: string): value is SourceModeFilter {
  return sourceModes.includes(value as SourceModeFilter);
}

function positionLabel(position: number | null) {
  return position ? `P${position}` : "Unranked";
}

function sourceLabel(mode: SourceModeFilter) {
  if (mode === "source-managed") return "Source-managed";
  if (mode === "manual") return "Manual";
  return "All";
}
