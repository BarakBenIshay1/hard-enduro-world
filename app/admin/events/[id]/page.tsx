import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ExternalLink, Save } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import { getAdminAccessContext } from "@/lib/admin/access";
import { formatDate } from "@/lib/format";
import {
  getAdminEventAudit,
  getAdminEventDetail,
  getAdminEventOptions,
} from "@/db/admin-events";
import { archiveAdminEvent, updateAdminEvent } from "@/app/admin/events/actions";
import { canManageEvents } from "@/lib/admin/event-cms";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; saved?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getAdminEventDetail(id);

  return {
    title: event?.name ?? "Event",
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default async function AdminEventDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query, access, options] = await Promise.all([
    params,
    searchParams,
    getAdminAccessContext(),
    getAdminEventOptions(),
  ]);
  const [event, audit] = await Promise.all([
    getAdminEventDetail(id),
    getAdminEventAudit(id),
  ]);

  if (!event) notFound();

  const canManage = canManageEvents(access.role);

  return (
    <div className="grid gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/admin/events"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
          >
            Back to events
          </Link>
          <h1 className="mt-3 text-3xl font-black lg:text-5xl">{event.name}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Edit stored event metadata, inspect related records, and review immutable
            audit history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminStatusBadge status={event.archivedAt ? "locked" : "ready"} />
          {event.officialUrl ? (
            <Link
              href={event.officialUrl}
              target="_blank"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Official URL
            </Link>
          ) : null}
        </div>
      </section>

      <EventMessage code={query?.error ?? query?.saved} />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <h2 className="text-xl font-black">Event editor</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            {canManage
              ? "Changes are validated and written with audit history."
              : "Reviewer access is read-only."}
          </p>

          <form action={updateAdminEvent} className="mt-6 grid gap-5">
            <input type="hidden" name="eventId" value={event.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Name"
                name="name"
                defaultValue={event.name}
                disabled={!canManage}
              />
              <TextField
                label="Slug"
                name="slug"
                defaultValue={event.slug}
                disabled={!canManage}
              />
              <SelectField
                label="Championship / Season"
                name="seasonId"
                defaultValue={event.seasonId}
                disabled={!canManage}
              >
                {options.seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.year} · {season.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Country"
                name="countryId"
                defaultValue={event.countryId ?? ""}
                disabled={!canManage}
              >
                <option value="">Unassigned</option>
                {options.countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name} ({country.isoCode})
                  </option>
                ))}
              </SelectField>
              <TextField
                label="City"
                name="city"
                defaultValue={event.city ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Venue"
                name="venue"
                defaultValue={event.venue ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Start Date"
                name="startDate"
                type="date"
                defaultValue={toDateInput(event.startDate)}
                disabled={!canManage}
              />
              <TextField
                label="End Date"
                name="endDate"
                type="date"
                defaultValue={event.endDate ? toDateInput(event.endDate) : ""}
                disabled={!canManage}
              />
              <TextField
                label="Official URL"
                name="officialUrl"
                defaultValue={event.officialUrl ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Organizer"
                name="organizer"
                defaultValue={event.organizer ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Hero Image"
                name="heroImage"
                defaultValue={event.heroImage ?? ""}
                disabled={!canManage}
              />
              <SelectField
                label="Status"
                name="status"
                defaultValue={event.status}
                disabled={!canManage}
              >
                {options.statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Visibility"
                name="visibility"
                defaultValue={event.visibility}
                disabled={!canManage}
              >
                {options.visibility.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {visibility}
                  </option>
                ))}
              </SelectField>
            </div>

            <TextAreaField
              label="Description"
              name="description"
              defaultValue={event.description ?? ""}
              disabled={!canManage}
            />
            <TextAreaField
              label="Gallery Images"
              name="galleryImages"
              defaultValue={event.galleryImages.join("\n")}
              disabled={!canManage}
              help="Add one approved image URL per line."
            />

            {canManage ? (
              <button
                type="submit"
                className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-accent px-5 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-gold"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Save Event
              </button>
            ) : null}
          </form>
        </Card>

        <aside className="grid gap-6">
          <Card className="p-5">
            <h2 className="text-xl font-black">Stored information</h2>
            <div className="mt-5 grid gap-3 text-sm">
              <Meta label="ID" value={event.id} />
              <Meta label="Season" value={String(event.season.year)} />
              <Meta label="Country" value={event.country?.name ?? "Unassigned"} />
              <Meta label="Organizer" value={event.organizer ?? "Unassigned"} />
              <Meta
                label="Hero Image"
                value={event.heroImage ? "Configured" : "Not set"}
              />
              <Meta label="Gallery Images" value={event.galleryImages.length} />
              <Meta label="Created" value={formatDate(event.createdAt)} />
              <Meta label="Last Updated" value={formatDate(event.updatedAt)} />
              <Meta
                label="Archived"
                value={event.archivedAt ? formatDate(event.archivedAt) : "No"}
              />
              <Meta label="Stages" value={event.stages.length} />
              <Meta label="Results" value={event.results.length} />
              <Meta label="Media" value={event.mediaItems.length} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-black">Archive</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
              Archiving never deletes the event. It marks the record private and keeps it
              available for audit history.
            </p>
            {canManage && !event.archivedAt ? (
              <form action={archiveAdminEvent} className="mt-5 grid gap-3">
                <input type="hidden" name="eventId" value={event.id} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="confirmArchive" />
                  Confirm archive
                </label>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-4 text-sm font-semibold text-red-200"
                >
                  <Archive className="h-4 w-4" aria-hidden="true" />
                  Archive Event
                </button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-foreground/[0.58]">
                {event.archivedAt ? "This event is archived." : "Read-only access."}
              </p>
            )}
          </Card>
        </aside>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Audit history</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            Immutable event changes recorded through `DataVersion`.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
              <tr>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Timestamp</th>
                <th className="px-5 py-4">Changed Fields</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-5 py-4">{item.action}</td>
                  <td className="px-5 py-4">{item.createdBy ?? "System"}</td>
                  <td className="px-5 py-4">{formatDate(item.createdAt)}</td>
                  <td className="px-5 py-4 text-foreground/[0.62]">
                    {formatChangedFields(item.next)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  type = "text",
  disabled,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        className="h-10 rounded-md border border-border bg-surface-muted px-3 text-sm disabled:opacity-60"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  disabled,
  children,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="h-10 rounded-md border border-border bg-surface-muted px-3 text-sm disabled:opacity-60"
      >
        {children}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue,
  disabled,
  help,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled?: boolean;
  help?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        rows={6}
        className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm disabled:opacity-60"
      />
      {help ? <span className="text-xs text-foreground/[0.48]">{help}</span> : null}
    </label>
  );
}

function Meta({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <span className="text-foreground/[0.48]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function EventMessage({ code }: { code?: string }) {
  if (!code) return null;

  const message =
    code === "created"
      ? "Event created."
      : code === "updated"
        ? "Event updated."
        : code === "archived"
          ? "Event archived."
          : code === "slug-exists"
            ? "Another event already uses this slug."
            : code === "invalid-date-range"
              ? "End date must be after start date."
              : code === "unauthorized"
                ? "You do not have permission to modify events."
                : "Please review the form fields and try again.";

  return (
    <div className="rounded-md border border-gold/30 bg-gold/10 p-4 text-sm text-gold">
      {message}
    </div>
  );
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatChangedFields(value: unknown) {
  if (!value || typeof value !== "object" || !("changedFields" in value)) {
    return "Full record";
  }

  const fields = (value as { changedFields?: unknown }).changedFields;
  return Array.isArray(fields) && fields.length ? fields.join(", ") : "No fields";
}
