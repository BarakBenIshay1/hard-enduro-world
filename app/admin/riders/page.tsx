import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import type { EventVisibility } from "@prisma/client";
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
import { canManageRiders } from "@/lib/admin/rider-cms";
import { parseAdminPage } from "@/lib/admin/platform";
import { getAdminRiders, type AdminRiderListFilters } from "@/db/admin-riders";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Riders",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const visibilities: EventVisibility[] = ["PUBLIC", "DRAFT", "PRIVATE"];
const lifecycles = ["active", "draft", "archived", "all"] as const;
type RiderLifecycle = (typeof lifecycles)[number];

export default async function AdminRidersPage({ searchParams }: PageProps) {
  const access = await getAdminAccessContext();
  const params = await searchParams;
  const filters = parseFilters(params);
  const data = await getAdminRiders(filters);
  const canManage = canManageRiders(access.role);

  return (
    <div className="grid min-w-0 gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Admin Riders
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">Riders CMS</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Manage rider profile metadata without changing results, points, standings, or
            historical classifications.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminStatusBadge status="ready" />
          {canManage ? (
            <Link
              href="/admin/riders/new"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hot"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Rider
            </Link>
          ) : (
            <span className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground/[0.58]">
              Read-only
            </span>
          )}
        </div>
      </section>

      <RiderMessage code={value(params, "error") ?? value(params, "saved")} />

      <Card className="p-5">
        <form className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <Field label="Search">
            <input
              name="search"
              defaultValue={filters.search ?? ""}
              placeholder="Name, slug, official URL"
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            />
          </Field>
          <Field label="Country">
            <select
              name="country"
              defaultValue={filters.country ?? ""}
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            >
              <option value="">All countries</option>
              {data.countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
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
              defaultValue={filters.sort ?? "last-asc"}
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            >
              <option value="last-asc">Last Name A-Z</option>
              <option value="last-desc">Last Name Z-A</option>
              <option value="first-asc">First Name A-Z</option>
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
          <h2 className="text-xl font-black">Rider records</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            {data.total} riders found. Page {data.page} of {data.totalPages}.
          </p>
        </div>
        <div className={adminTableScrollClass}>
          <table className={adminCompactTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTablePrimaryCellClass}>Rider</th>
                <th className={adminTableHeaderCellClass}>Country</th>
                <th className={adminTableHeaderCellClass}>Motorcycle</th>
                <th className={adminTableHeaderCellClass}>Visibility</th>
                <th className={adminTableHeaderCellClass}>Dependencies</th>
                <th className={adminTableHeaderCellClass}>Last Updated</th>
                <th className={adminTableActionCellClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.riders.map((rider) => (
                <tr key={rider.id} className="border-t border-border">
                  <td className={adminTablePrimaryCellClass}>
                    <div className="font-semibold">
                      {rider.firstName} {rider.lastName}
                    </div>
                    <div className="mt-1 text-xs text-foreground/[0.48]">
                      {rider.slug}
                    </div>
                  </td>
                  <td className={adminTableCellClass}>
                    {rider.country?.name ?? "Unassigned"}
                  </td>
                  <td className={adminTableCellClass}>
                    {rider.currentMotorcycle
                      ? `${rider.currentMotorcycle.manufacturer.name} ${rider.currentMotorcycle.model}`
                      : "Unassigned"}
                  </td>
                  <td className={adminTableCellClass}>
                    {rider.archivedAt ? "ARCHIVED" : rider.visibility}
                  </td>
                  <td className={adminTableMutedCellClass}>
                    Results {rider._count.results} / Standings {rider._count.standings}
                  </td>
                  <td className={adminTableCellClass}>{formatDate(rider.updatedAt)}</td>
                  <td className={adminTableActionCellClass}>
                    <Link
                      href={`/admin/riders/${rider.id}`}
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
): AdminRiderListFilters {
  const visibility = value(params, "visibility");
  const lifecycle = value(params, "lifecycle");
  return {
    search: value(params, "search"),
    country: value(params, "country"),
    visibility: isVisibility(visibility) ? visibility : undefined,
    lifecycle: isLifecycle(lifecycle) ? lifecycle : "active",
    page: parseAdminPage(value(params, "page")),
    sort: value(params, "sort") ?? "last-asc",
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

function isLifecycle(value: string | undefined): value is RiderLifecycle {
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
  filters: AdminRiderListFilters;
  current: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card p-4 text-sm">
      <span>
        Page {current} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Link
          href={createRidersHref(filters, Math.max(current - 1, 1))}
          className="rounded-md border border-border px-3 py-2 font-semibold"
        >
          Previous
        </Link>
        <Link
          href={createRidersHref(filters, Math.min(current + 1, totalPages))}
          className="rounded-md border border-border px-3 py-2 font-semibold"
        >
          Next
        </Link>
      </div>
    </div>
  );
}

function createRidersHref(filters: AdminRiderListFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.country) params.set("country", filters.country);
  if (filters.visibility) params.set("visibility", filters.visibility);
  if (filters.lifecycle) params.set("lifecycle", filters.lifecycle);
  if (filters.sort) params.set("sort", filters.sort);
  params.set("page", String(page));
  return `/admin/riders?${params.toString()}`;
}

function RiderMessage({ code }: { code?: string }) {
  if (!code) return null;
  const isSuccess = ["created", "updated", "archived", "restored", "deleted"].includes(
    code,
  );
  const message =
    code === "created"
      ? "✓ Rider created successfully"
      : code === "updated"
        ? "✓ Changes saved successfully"
        : code === "archived"
          ? "✓ Rider archived successfully"
          : code === "restored"
            ? "✓ Rider restored successfully"
            : code === "deleted"
              ? "✓ Test rider permanently deleted"
              : code === "unauthorized"
                ? "You do not have permission to modify riders."
                : "The requested rider action could not be completed.";

  return <EventAlert tone={isSuccess ? "success" : "error"}>{message}</EventAlert>;
}
