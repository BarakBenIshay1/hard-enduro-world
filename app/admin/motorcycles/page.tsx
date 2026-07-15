import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import type { EventVisibility, MotorcycleStatus } from "@prisma/client";
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
import { getAdminAccessContext } from "@/lib/admin/access";
import { canManageMotorcycles } from "@/lib/admin/motorcycle-cms";
import { parseAdminPage } from "@/lib/admin/platform";
import {
  getAdminMotorcycles,
  type AdminMotorcycleListFilters,
} from "@/db/admin-motorcycles";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Motorcycles",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const visibilities: EventVisibility[] = ["PUBLIC", "DRAFT", "PRIVATE"];
const statuses: MotorcycleStatus[] = ["ACTIVE", "HISTORIC", "INACTIVE"];
const lifecycles = ["active", "draft", "archived", "all"] as const;
type MotorcycleLifecycle = (typeof lifecycles)[number];

export default async function AdminMotorcyclesPage({ searchParams }: PageProps) {
  const access = await getAdminAccessContext();
  const params = await searchParams;
  const filters = parseFilters(params);
  const data = await getAdminMotorcycles(filters);
  const canManage = canManageMotorcycles(access.role);

  return (
    <div className="grid min-w-0 gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Admin Motorcycles
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">Motorcycles CMS</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Manage technical motorcycle profiles, manufacturer relationships, lifecycle,
            visibility, and approved hero images without changing results or standings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminStatusBadge status="ready" />
          {canManage ? (
            <Link
              href="/admin/motorcycles/new"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hot"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Motorcycle
            </Link>
          ) : (
            <span className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground/[0.58]">
              Read-only
            </span>
          )}
        </div>
      </section>

      <MotorcycleMessage code={value(params, "error") ?? value(params, "saved")} />

      <Card className="p-5">
        <form className="grid gap-4 lg:grid-cols-[1.3fr_1fr_0.8fr_1fr_1fr_1fr_auto] lg:items-end">
          <Field label="Search">
            <input
              name="search"
              defaultValue={filters.search ?? ""}
              placeholder="Model, slug, manufacturer"
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            />
          </Field>
          <Field label="Manufacturer">
            <select
              name="manufacturer"
              defaultValue={filters.manufacturer ?? ""}
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            >
              <option value="">All manufacturers</option>
              {data.manufacturers.map((manufacturer) => (
                <option key={manufacturer.id} value={manufacturer.id}>
                  {manufacturer.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Year">
            <select
              name="year"
              defaultValue={filters.year ? String(filters.year) : ""}
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            >
              <option value="">All years</option>
              {data.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Visibility">
            <select
              name="visibility"
              defaultValue={filters.visibility ?? ""}
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            >
              <option value="">All visibility</option>
              {visibilities.map((visibility) => (
                <option key={visibility} value={visibility}>
                  {visibility}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lifecycle">
            <select
              name="lifecycle"
              defaultValue={filters.lifecycle ?? "active"}
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
              <option value="all">All</option>
            </select>
          </Field>
          <Field label="Sort">
            <select
              name="sort"
              defaultValue={filters.sort ?? "model-asc"}
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            >
              <option value="model-asc">Model A-Z</option>
              <option value="model-desc">Model Z-A</option>
              <option value="year-desc">Year ↓</option>
              <option value="year-asc">Year ↑</option>
              <option value="updated-desc">Last Updated ↓</option>
              <option value="updated-asc">Last Updated ↑</option>
            </select>
          </Field>
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
          <h2 className="text-xl font-black">Motorcycle records</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            {data.total} motorcycles found. Page {data.page} of {data.totalPages}.
          </p>
        </div>
        <div className={adminTableScrollClass}>
          <table className={adminCompactTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTablePrimaryCellClass}>Motorcycle</th>
                <th className={adminTableHeaderCellClass}>Manufacturer</th>
                <th className={adminTableHeaderCellClass}>Year</th>
                <th className={adminTableHeaderCellClass}>Engine</th>
                <th className={adminTableHeaderCellClass}>Visibility</th>
                <th className={adminTableHeaderCellClass}>Dependencies</th>
                <th className={adminTableHeaderCellClass}>Last Updated</th>
                <th className={adminTableActionCellClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.motorcycles.map((motorcycle) => (
                <tr key={motorcycle.id} className="border-t border-border">
                  <td className={adminTablePrimaryCellClass}>
                    <div className="font-semibold">{motorcycle.model}</div>
                    <div className="mt-1 text-xs text-foreground/[0.48]">
                      {motorcycle.slug}
                    </div>
                  </td>
                  <td className={adminTableCellClass}>{motorcycle.manufacturer.name}</td>
                  <td className={adminTableCellClass}>{motorcycle.year ?? "TBC"}</td>
                  <td className={adminTableCellClass}>
                    {motorcycle.engineCc ? `${motorcycle.engineCc} cc` : "TBC"}
                  </td>
                  <td className={adminTableCellClass}>
                    {motorcycle.archivedAt ? "ARCHIVED" : motorcycle.visibility}
                  </td>
                  <td className={adminTableMutedCellClass}>
                    Riders {motorcycle._count.currentRiders} / Results{" "}
                    {motorcycle._count.results}
                  </td>
                  <td className={adminTableCellClass}>
                    {formatDate(motorcycle.updatedAt)}
                  </td>
                  <td className={adminTableActionCellClass}>
                    <Link
                      href={`/admin/motorcycles/${motorcycle.id}`}
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
      </Card>

      <Pagination filters={filters} current={data.page} totalPages={data.totalPages} />
    </div>
  );
}

function parseFilters(
  params: Record<string, string | string[] | undefined> | undefined,
): AdminMotorcycleListFilters {
  const visibility = value(params, "visibility");
  const status = value(params, "status");
  const lifecycle = value(params, "lifecycle");
  const year = value(params, "year");
  return {
    search: value(params, "search"),
    manufacturer: value(params, "manufacturer"),
    year: year && Number.isInteger(Number(year)) ? Number(year) : undefined,
    visibility: isVisibility(visibility) ? visibility : undefined,
    status: isStatus(status) ? status : undefined,
    lifecycle: isLifecycle(lifecycle) ? lifecycle : "active",
    page: parseAdminPage(value(params, "page")),
    sort: value(params, "sort") ?? "model-asc",
  };
}

function value(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const raw = params?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

function isVisibility(value: string | undefined): value is EventVisibility {
  return Boolean(value && visibilities.includes(value as EventVisibility));
}

function isStatus(value: string | undefined): value is MotorcycleStatus {
  return Boolean(value && statuses.includes(value as MotorcycleStatus));
}

function isLifecycle(value: string | undefined): value is MotorcycleLifecycle {
  return Boolean(value && lifecycles.includes(value as (typeof lifecycles)[number]));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Pagination({
  filters,
  current,
  totalPages,
}: {
  filters: AdminMotorcycleListFilters;
  current: number;
  totalPages: number;
}) {
  const previous = current > 1 ? buildPageHref(filters, current - 1) : null;
  const next = current < totalPages ? buildPageHref(filters, current + 1) : null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-foreground/[0.58]">
        Page {current} of {totalPages}
      </p>
      <div className="flex gap-2">
        {previous ? (
          <Link
            href={previous}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold"
          >
            Previous
          </Link>
        ) : null}
        {next ? (
          <Link
            href={next}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold"
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function buildPageHref(filters: AdminMotorcycleListFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.manufacturer) params.set("manufacturer", filters.manufacturer);
  if (filters.year) params.set("year", String(filters.year));
  if (filters.visibility) params.set("visibility", filters.visibility);
  if (filters.status) params.set("status", filters.status);
  if (filters.lifecycle) params.set("lifecycle", filters.lifecycle);
  if (filters.sort) params.set("sort", filters.sort);
  params.set("page", String(page));
  return `/admin/motorcycles?${params.toString()}`;
}

function MotorcycleMessage({ code }: { code?: string }) {
  if (!code) return null;
  const message =
    code === "created"
      ? "Motorcycle created."
      : code === "updated"
        ? "Motorcycle saved."
        : code === "archived"
          ? "Motorcycle archived."
          : code === "restored"
            ? "Motorcycle restored as draft."
            : code === "deleted"
              ? "Motorcycle permanently deleted."
              : code === "unauthorized"
                ? "You do not have permission to manage motorcycles."
                : "Please review the motorcycle record and try again.";
  return (
    <EventAlert tone={code === "unauthorized" ? "error" : "success"}>
      {message}
    </EventAlert>
  );
}
