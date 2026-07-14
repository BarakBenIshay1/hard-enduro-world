import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import type { EventStatus } from "@prisma/client";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import { getAdminEvents, type AdminEventListFilters } from "@/db/admin-events";
import { getAdminAccessContext } from "@/lib/admin/access";
import { canManageEvents } from "@/lib/admin/event-cms";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events",
  description: "Manage championship events.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const eventStatuses: EventStatus[] = [
  "SCHEDULED",
  "LIVE",
  "SUSPENDED",
  "COMPLETED",
  "CANCELLED",
];

export default async function AdminEventsPage({ searchParams }: PageProps) {
  const access = await getAdminAccessContext();
  const params = await searchParams;
  const filters = parseFilters(params);
  const data = await getAdminEvents(filters);
  const canManage = canManageEvents(access.role);

  return (
    <div className="grid gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Admin Events
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">Events CMS</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Browse, search, create, edit, and archive championship event records with
            immutable audit history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminStatusBadge status="ready" />
          {canManage ? (
            <Link
              href="/admin/events/new"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hot"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Event
            </Link>
          ) : (
            <span className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground/[0.58]">
              Read-only
            </span>
          )}
        </div>
      </section>

      <EventMessage code={value(params, "error") ?? value(params, "saved")} />

      <Card className="p-5">
        <form className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <Field label="Search">
            <input
              name="search"
              defaultValue={filters.search ?? ""}
              placeholder="Event, slug, city, venue"
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            />
          </Field>
          <Field label="Season">
            <select
              name="season"
              defaultValue={filters.season ?? ""}
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            >
              <option value="">All seasons</option>
              {data.seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.year}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Championship">
            <input
              name="championship"
              defaultValue={filters.championship ?? ""}
              placeholder="Championship"
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            />
          </Field>
          <Field label="Status">
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            >
              <option value="">All statuses</option>
              {eventStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sort">
            <select
              name="sort"
              defaultValue={filters.sort ?? "start-asc"}
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            >
              <option value="start-asc">Start Date ↑</option>
              <option value="start-desc">Start Date ↓</option>
              <option value="updated-desc">Last Updated ↓</option>
              <option value="updated-asc">Last Updated ↑</option>
              <option value="name-asc">Event A-Z</option>
              <option value="name-desc">Event Z-A</option>
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

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-black">Event records</h2>
            <p className="mt-2 text-sm text-foreground/[0.62]">
              {data.total} events found. Page {data.page} of {data.totalPages}.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
              <tr>
                <th className="px-5 py-4">Event</th>
                <th className="px-5 py-4">Championship</th>
                <th className="px-5 py-4">Season</th>
                <th className="px-5 py-4">Country</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Start Date</th>
                <th className="px-5 py-4">End Date</th>
                <th className="px-5 py-4">Last Updated</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((event) => (
                <tr key={event.id} className="border-t border-border">
                  <td className="px-5 py-4">
                    <div className="font-semibold">{event.name}</div>
                    <div className="mt-1 text-xs text-foreground/[0.48]">
                      {event.slug}
                    </div>
                    {event.archivedAt ? (
                      <span className="mt-2 inline-flex rounded border border-zinc-500/30 px-2 py-1 text-xs text-zinc-300">
                        Archived
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-foreground/[0.66]">
                    {event.season.name}
                  </td>
                  <td className="px-5 py-4">{event.season.year}</td>
                  <td className="px-5 py-4">{event.country?.name ?? "Unassigned"}</td>
                  <td className="px-5 py-4">
                    <StatusPill value={event.status} />
                  </td>
                  <td className="px-5 py-4">{formatDate(event.startDate)}</td>
                  <td className="px-5 py-4">
                    {event.endDate ? formatDate(event.endDate) : "None"}
                  </td>
                  <td className="px-5 py-4">{formatDate(event.updatedAt)}</td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/events/${event.id}`}
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
): AdminEventListFilters {
  const status = value(params, "status");

  return {
    search: value(params, "search"),
    season: value(params, "season"),
    championship: value(params, "championship"),
    status: isEventStatus(status) ? status : undefined,
    page: Number(value(params, "page") ?? 1),
    sort: value(params, "sort") ?? "start-asc",
  };
}

function value(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const raw = params?.[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

function isEventStatus(value: string | undefined): value is EventStatus {
  return Boolean(value && eventStatuses.includes(value as EventStatus));
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

function StatusPill({ value }: { value: EventStatus }) {
  return (
    <span className="rounded-md border border-border bg-surface-muted px-2.5 py-1 text-xs font-semibold">
      {value}
    </span>
  );
}

function Pagination({
  filters,
  current,
  totalPages,
}: {
  filters: AdminEventListFilters;
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
          href={createEventsHref(filters, Math.max(current - 1, 1))}
          className="rounded-md border border-border px-3 py-2 font-semibold"
        >
          Previous
        </Link>
        <Link
          href={createEventsHref(filters, Math.min(current + 1, totalPages))}
          className="rounded-md border border-border px-3 py-2 font-semibold"
        >
          Next
        </Link>
      </div>
    </div>
  );
}

function createEventsHref(filters: AdminEventListFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.season) params.set("season", filters.season);
  if (filters.championship) params.set("championship", filters.championship);
  if (filters.status) params.set("status", filters.status);
  if (filters.sort) params.set("sort", filters.sort);
  params.set("page", String(page));
  return `/admin/events?${params.toString()}`;
}

function EventMessage({ code }: { code?: string }) {
  if (!code) return null;

  const message =
    code === "unauthorized"
      ? "You do not have permission to modify events."
      : code === "created"
        ? "Event created."
        : code === "updated"
          ? "Event updated."
          : code === "archived"
            ? "Event archived."
            : "The requested event action could not be completed.";

  return (
    <div className="rounded-md border border-gold/30 bg-gold/10 p-4 text-sm text-gold">
      {message}
    </div>
  );
}
