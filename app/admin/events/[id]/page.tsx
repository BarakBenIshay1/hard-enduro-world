import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { EventAlert } from "@/components/admin/events/event-alert";
import { EventEditorForm } from "@/components/admin/events/event-editor-form";
import { EventSubmitButton } from "@/components/admin/events/event-submit-button";
import { PermanentDeleteForm } from "@/components/admin/events/permanent-delete-form";
import { Card } from "@/components/ui/card";
import { getAdminAccessContext } from "@/lib/admin/access";
import { formatDate } from "@/lib/format";
import {
  getAdminEventAudit,
  getAdminEventDeleteEligibility,
  getAdminEventDetail,
  getAdminEventOptions,
} from "@/db/admin-events";
import {
  archiveAdminEvent,
  restoreAdminEvent,
  updateAdminEvent,
} from "@/app/admin/events/actions";
import { canManageEvents, canPermanentlyDeleteEvents } from "@/lib/admin/event-cms";

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
  const [event, audit, deleteEligibility] = await Promise.all([
    getAdminEventDetail(id),
    getAdminEventAudit(id),
    getAdminEventDeleteEligibility(id),
  ]);

  if (!event) notFound();

  const canManage = canManageEvents(access.role);
  const canDelete = canPermanentlyDeleteEvents(access.role);

  return (
    <div className="grid min-w-0 gap-6 overflow-x-hidden">
      <section className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/events"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
          >
            Back to events
          </Link>
          <h1 className="mt-3 break-words text-3xl font-black lg:text-4xl">
            {event.name}
          </h1>
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

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_320px] 2xl:items-start">
        <Card className="min-w-0 p-4 sm:p-5">
          <h2 className="text-xl font-black">Event editor</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            {canManage
              ? "Changes are validated and written with audit history."
              : "Reviewer access is read-only."}
          </p>

          <EventEditorForm action={updateAdminEvent} className="mt-5 grid gap-4">
            <input type="hidden" name="eventId" value={event.id} />
            <div className="grid min-w-0 gap-3 lg:grid-cols-2">
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
              <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-card/95 p-4 backdrop-blur sm:-mx-5">
                <EventSubmitButton
                  label="Save Event"
                  pendingLabel="Saving..."
                  icon="save"
                />
              </div>
            ) : null}
          </EventEditorForm>
        </Card>

        <aside className="grid min-w-0 gap-4 self-start 2xl:sticky 2xl:top-6">
          <Card className="min-w-0 p-4">
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

          <Card className="min-w-0 p-4">
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
                <EventSubmitButton
                  label="Archive Event"
                  pendingLabel="Archiving..."
                  icon="archive"
                  tone="danger"
                />
              </form>
            ) : canManage && event.archivedAt ? (
              <form action={restoreAdminEvent} className="mt-5 grid gap-3">
                <input type="hidden" name="eventId" value={event.id} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="confirmRestore" />
                  Confirm restore as draft
                </label>
                <EventSubmitButton
                  label="Restore Event"
                  pendingLabel="Restoring..."
                  icon="restore"
                  tone="neutral"
                />
              </form>
            ) : (
              <p className="mt-4 text-sm text-foreground/[0.58]">
                {event.archivedAt ? "This event is archived." : "Read-only access."}
              </p>
            )}
          </Card>

          <Card className="min-w-0 border-red-500/25 p-4">
            <h2 className="text-xl font-black text-red-200">Danger Zone</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
              Permanent deletion is reserved for eligible archived manual/test records. It
              never cascades protected event data.
            </p>
            <div className="mt-4 rounded-md border border-border bg-surface-muted p-4 text-sm">
              <p className="font-semibold">
                Dependency check: {deleteEligibility.eligible ? "Eligible" : "Blocked"}
              </p>
              {deleteEligibility.blockers.length ? (
                <ul className="mt-3 grid gap-1 text-foreground/[0.62]">
                  {deleteEligibility.blockers.map((blocker) => (
                    <li key={blocker}>- {blocker}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-foreground/[0.62]">
                  No protected dependencies were found.
                </p>
              )}
            </div>
            {canDelete ? (
              <PermanentDeleteForm
                eventId={event.id}
                eventName={event.name}
                eventSlug={event.slug}
                eligible={deleteEligibility.eligible}
              />
            ) : (
              <p className="mt-4 text-sm text-foreground/[0.58]">
                Only OWNER users can permanently delete eligible manual/test events.
              </p>
            )}
          </Card>
        </aside>
      </div>

      <Card className="min-w-0 overflow-hidden">
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
                <th className="px-5 py-4">Old / New</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-5 py-4">{item.action}</td>
                  <td className="px-5 py-4">
                    <div className="font-semibold">
                      {item.actor?.displayName ?? item.actor?.email ?? "System"}
                    </div>
                    <div className="mt-1 break-all text-xs text-foreground/[0.48]">
                      {item.actor?.email ?? item.createdBy ?? "System"}
                    </div>
                  </td>
                  <td className="px-5 py-4">{formatAdminTimestamp(item.createdAt)}</td>
                  <td className="px-5 py-4 text-foreground/[0.62]">
                    {formatChangedFields(item.next)}
                  </td>
                  <td className="px-5 py-4 text-foreground/[0.62]">
                    <AuditDiffs value={item.next} />
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
    <label className="grid min-w-0 gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        className="h-10 min-w-0 w-full rounded-md border border-border bg-surface-muted px-3 text-sm disabled:opacity-60"
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
    <label className="grid min-w-0 gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="h-10 min-w-0 w-full rounded-md border border-border bg-surface-muted px-3 text-sm disabled:opacity-60"
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
    <label className="grid min-w-0 gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        rows={6}
        className="min-w-0 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm disabled:opacity-60"
      />
      {help ? <span className="text-xs text-foreground/[0.48]">{help}</span> : null}
    </label>
  );
}

function Meta({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 border-b border-border pb-2">
      <span className="text-foreground/[0.48]">{label}</span>
      <span className="min-w-0 break-words text-right font-semibold">{value}</span>
    </div>
  );
}

function EventMessage({ code }: { code?: string }) {
  if (!code) return null;

  const isSuccess = ["created", "updated", "archived", "restored"].includes(code);
  const message =
    code === "created"
      ? "✓ Event created successfully"
      : code === "updated"
        ? "✓ Changes saved successfully"
        : code === "archived"
          ? "✓ Event archived successfully"
          : code === "restored"
            ? "✓ Event restored successfully"
            : code === "slug-exists"
              ? "Another event already uses this slug."
              : code === "invalid-date-range"
                ? "End date must be after start date."
                : code === "unauthorized"
                  ? "You do not have permission to modify events."
                  : code === "archive-confirmation"
                    ? "Confirm archive before submitting."
                    : code === "restore-confirmation"
                      ? "Confirm restore before submitting."
                      : code === "delete-confirmation"
                        ? "Confirm permanent deletion before submitting."
                        : code === "delete-confirmation-mismatch"
                          ? "The delete confirmation did not match the event name or slug."
                          : code === "delete-reason-required"
                            ? "A deletion reason is required."
                            : code === "delete-blocked"
                              ? "This event cannot be permanently deleted because protected dependencies exist."
                              : code === "database-unavailable"
                                ? "The database is temporarily unavailable. Please retry in a moment."
                                : "Please review the form fields and try again.";

  return <EventAlert tone={isSuccess ? "success" : "error"}>{message}</EventAlert>;
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

function AuditDiffs({ value }: { value: unknown }) {
  if (!value || typeof value !== "object" || !("fieldDiffs" in value)) {
    return <span>No field-level diff</span>;
  }

  const diffs = (value as { fieldDiffs?: unknown }).fieldDiffs;
  if (!Array.isArray(diffs) || diffs.length === 0) {
    return <span>No changed values</span>;
  }

  return (
    <div className="grid max-w-[360px] gap-3">
      {diffs.map((diff, index) => {
        if (!isAuditDiff(diff)) return null;
        return (
          <div key={`${diff.field}-${index}`} className="grid gap-1">
            <div className="font-semibold text-foreground">{diff.field}</div>
            <div className="grid gap-1 rounded border border-border bg-surface-muted p-2 text-xs">
              <span>Old: {formatAuditValue(diff.oldValue)}</span>
              <span>New: {formatAuditValue(diff.newValue)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function isAuditDiff(
  value: unknown,
): value is { field: string; oldValue: unknown; newValue: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    "field" in value &&
    typeof (value as { field?: unknown }).field === "string"
  );
}

function formatAuditValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Empty";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Empty";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatAdminTimestamp(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("month")} ${get("day")}, ${get("year")} ${get("hour")}:${get("minute")}:${get("second")} (UTC+3)`;
}
