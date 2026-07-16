import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";
import type { ConnectorReviewAction, ConnectorReviewStatus } from "@prisma/client";
import { Card } from "@/components/ui/card";
import {
  adminTableActionCellClass,
  adminTableCardClass,
  adminTableCellClass,
  adminTableHeadClass,
  adminTableHeaderCellClass,
  adminTableMutedCellClass,
  adminTablePrimaryCellClass,
  adminTableScrollClass,
  adminWideTableClass,
} from "@/components/admin/admin-table-styles";
import {
  ActionBadge,
  ConfidenceValue,
  ReviewStatusBadge,
} from "@/components/admin/review-badges";
import {
  getConnectorReviewItems,
  type ConnectorReviewFilters,
} from "@/db/connector-review";
import { getAdminAccessContext, canAccessAdmin } from "@/lib/admin/access";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Import Review",
  description: "Internal connector review queue.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const reviewStatuses: ConnectorReviewStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUPERSEDED",
];
const reviewActions: ConnectorReviewAction[] = [
  "NEW_EVENT",
  "UPDATE_EVENT",
  "SOURCE_REMOVED",
  "MANUAL_REVIEW",
  "NEW_RESULT",
  "UPDATE_RESULT",
  "RESULT_CONFLICT",
  "RESULT_UNRESOLVED",
  "RESULT_INVALID",
  "RESULT_MISSING_SOURCE",
  "NEW_STAGE_RESULT",
  "UPDATE_STAGE_RESULT",
  "STAGE_RESULT_CONFLICT",
  "STAGE_RESULT_UNRESOLVED",
  "STAGE_RESULT_INVALID",
  "STAGE_RESULT_MISSING_SOURCE",
  "NEW_STANDING",
  "UPDATE_STANDING",
  "UNCHANGED_STANDING",
  "STANDING_INVALID",
];

export default async function AdminReviewPage({ searchParams }: PageProps) {
  const access = await getAdminAccessContext();
  if (!canAccessAdmin(access, "review:view")) notFound();

  const params = await searchParams;
  const filters = parseFilters(params);
  const data = await getConnectorReviewItems(filters);
  const pendingCount = data.items.filter(
    (item) => item.reviewStatus === "PENDING",
  ).length;

  return (
    <div className="grid min-w-0 gap-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Import Review
        </p>
        <h1 className="mt-2 text-3xl font-black lg:text-5xl">Connector review queue</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Inspect official-source proposals before approval. Decisions only update
          internal review status and audit history; public event records are not changed.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QueueCard label="Visible items" value={data.total} />
        <QueueCard label="Pending on page" value={pendingCount} />
        <QueueCard label="Page" value={`${data.page} / ${data.totalPages}`} />
        <QueueCard label="Public events updated" value="0" />
      </div>

      <ReviewFilters filters={filters} options={data.filterOptions} />

      <Card className={adminTableCardClass}>
        <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-black">Connector proposals</h2>
            <p className="mt-2 text-sm text-foreground/[0.62]">
              Pending items are shown first, then the newest snapshots.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.16em] text-foreground/[0.48]">
            {data.total} total
          </p>
        </div>
        <div className={adminTableScrollClass}>
          <table className={adminWideTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                {[
                  "Season",
                  "Event",
                  "Action",
                  "Confidence",
                  "Match",
                  "Status",
                  "Application",
                  "Snapshot",
                  "Created",
                  "Updated",
                  "Open",
                ].map((heading) => (
                  <th key={heading} className={adminTableHeaderCellClass}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className={adminTableCellClass}>
                    <span className="font-semibold">{item.season}</span>
                  </td>
                  <td className={adminTablePrimaryCellClass}>
                    <div className="font-semibold">{item.eventName}</div>
                    <div className="mt-1 font-mono text-xs text-foreground/[0.45]">
                      {item.id}
                    </div>
                  </td>
                  <td className={adminTableCellClass}>
                    <ActionBadge action={item.suggestedAction} />
                  </td>
                  <td className={adminTableCellClass}>
                    <ConfidenceValue value={item.confidence} />
                  </td>
                  <td className={adminTableMutedCellClass}>
                    {item.matchingStrategy ?? "manual"}
                  </td>
                  <td className={adminTableCellClass}>
                    <ReviewStatusBadge status={item.reviewStatus} />
                  </td>
                  <td className={adminTableCellClass}>
                    <span className="inline-flex rounded-sm border border-border bg-surface-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
                      {item.applicationStatus.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className={adminTableCellClass}>
                    <div>{formatDate(item.snapshot.createdAt)}</div>
                    <div className="mt-1 font-mono text-xs text-foreground/[0.45]">
                      {item.snapshot.id}
                    </div>
                  </td>
                  <td className={adminTableCellClass}>{formatDate(item.createdAt)}</td>
                  <td className={adminTableCellClass}>{formatDate(item.updatedAt)}</td>
                  <td className={adminTableActionCellClass}>
                    <Link
                      href={`/admin/review/${item.id}`}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface-muted px-3 text-xs font-semibold hover:border-accent/50"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.items.length === 0 ? (
          <div className="border-t border-border p-6 text-sm text-foreground/[0.62]">
            No review items match the current filters.
          </div>
        ) : null}
      </Card>

      <Pagination page={data.page} totalPages={data.totalPages} filters={filters} />
    </div>
  );
}

function ReviewFilters({
  filters,
  options,
}: {
  filters: ConnectorReviewFilters;
  options: Awaited<ReturnType<typeof getConnectorReviewItems>>["filterOptions"];
}) {
  return (
    <Card className="p-5">
      <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Select name="connector" label="Connector" value={filters.connector ?? ""}>
          <option value="">All</option>
          {options.connectors.map((connector) => (
            <option key={connector} value={connector}>
              {connector}
            </option>
          ))}
        </Select>
        <Select name="season" label="Season" value={String(filters.season ?? "")}>
          <option value="">All</option>
          {options.seasons.map((season) => (
            <option key={season} value={season}>
              {season}
            </option>
          ))}
        </Select>
        <Select name="status" label="Status" value={filters.status ?? ""}>
          <option value="">All</option>
          {reviewStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Select name="action" label="Action" value={filters.action ?? ""}>
          <option value="">All</option>
          {reviewActions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </Select>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.58]">
          Event name
          <input
            name="eventName"
            defaultValue={filters.eventName ?? ""}
            className="mt-2 h-11 w-full rounded-md border border-border bg-surface-muted px-3 text-sm normal-case tracking-normal text-foreground outline-none focus:border-accent"
            placeholder="Search event"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.58]">
          Min confidence
          <input
            name="minimumConfidence"
            type="number"
            min="0"
            max="1"
            step="0.05"
            defaultValue={filters.minimumConfidence ?? ""}
            className="mt-2 h-11 w-full rounded-md border border-border bg-surface-muted px-3 text-sm normal-case tracking-normal text-foreground outline-none focus:border-accent"
            placeholder="0.8"
          />
        </label>
        <div className="flex items-end gap-2 md:col-span-2 xl:col-span-6">
          <button className="h-10 rounded-md bg-accent px-4 text-sm font-black text-black">
            Apply filters
          </button>
          <Link
            href="/admin/review"
            className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold"
          >
            Reset
          </Link>
        </div>
      </form>
    </Card>
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
    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.58]">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="mt-2 h-11 w-full rounded-md border border-border bg-surface-muted px-3 text-sm normal-case tracking-normal text-foreground outline-none focus:border-accent"
      >
        {children}
      </select>
    </label>
  );
}

function Pagination({
  page,
  totalPages,
  filters,
}: {
  page: number;
  totalPages: number;
  filters: ConnectorReviewFilters;
}) {
  const previous = page > 1 ? createReviewHref({ ...filters, page: page - 1 }) : null;
  const next =
    page < totalPages ? createReviewHref({ ...filters, page: page + 1 }) : null;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground/[0.58]">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {previous ? (
          <Link
            className="rounded-md border border-border px-4 py-2 text-sm"
            href={previous}
          >
            Previous
          </Link>
        ) : null}
        {next ? (
          <Link className="rounded-md border border-border px-4 py-2 text-sm" href={next}>
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function QueueCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-accent">{value}</p>
    </Card>
  );
}

function parseFilters(
  params?: Record<string, string | string[] | undefined>,
): ConnectorReviewFilters {
  const value = (key: string) => single(params?.[key]);
  const status = value("status");
  const action = value("action");

  return {
    connector: value("connector") || undefined,
    season: numberValue(value("season")),
    status: isReviewStatus(status) ? status : undefined,
    action: isReviewAction(action) ? action : undefined,
    eventName: value("eventName") || undefined,
    snapshotId: value("snapshotId") || undefined,
    minimumConfidence: numberValue(value("minimumConfidence")),
    page: numberValue(value("page")) ?? 1,
  };
}

function createReviewHref(filters: ConnectorReviewFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return `/admin/review?${params.toString()}`;
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberValue(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isReviewStatus(value: string | undefined): value is ConnectorReviewStatus {
  return reviewStatuses.includes(value as ConnectorReviewStatus);
}

function isReviewAction(value: string | undefined): value is ConnectorReviewAction {
  return reviewActions.includes(value as ConnectorReviewAction);
}
