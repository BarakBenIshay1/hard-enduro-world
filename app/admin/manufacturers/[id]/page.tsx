import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { EventAlert } from "@/components/admin/events/event-alert";
import { EventEditorForm } from "@/components/admin/events/event-editor-form";
import { EventSubmitButton } from "@/components/admin/events/event-submit-button";
import { ImageUploadField } from "@/components/admin/media/image-upload-field";
import { Card } from "@/components/ui/card";
import {
  archiveAdminManufacturer,
  permanentlyDeleteAdminManufacturer,
  restoreAdminManufacturer,
  updateAdminManufacturer,
} from "@/app/admin/manufacturers/actions";
import {
  getAdminManufacturerAudit,
  getAdminManufacturerDeleteEligibility,
  getAdminManufacturerDetail,
  getAdminManufacturerOptions,
} from "@/db/admin-manufacturers";
import { getAdminAccessContext } from "@/lib/admin/access";
import {
  canManageManufacturers,
  canPermanentlyDeleteManufacturers,
} from "@/lib/admin/manufacturer-cms";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; saved?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const manufacturer = await getAdminManufacturerDetail(id);
  return {
    title: manufacturer ? manufacturer.name : "Manufacturer",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminManufacturerDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, query, access, options] = await Promise.all([
    params,
    searchParams,
    getAdminAccessContext(),
    getAdminManufacturerOptions(),
  ]);
  const [manufacturer, audit, deleteEligibility] = await Promise.all([
    getAdminManufacturerDetail(id),
    getAdminManufacturerAudit(id),
    getAdminManufacturerDeleteEligibility(id),
  ]);

  if (!manufacturer) notFound();

  const canManage = canManageManufacturers(access.role);
  const canDelete = canPermanentlyDeleteManufacturers(access.role);

  return (
    <div className="grid min-w-0 gap-6 overflow-x-hidden">
      <section className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/manufacturers"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
          >
            Back to manufacturers
          </Link>
          <h1 className="mt-3 break-words text-3xl font-black lg:text-4xl">
            {manufacturer.name}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Edit manufacturer profile metadata only. Motorcycles, teams, riders, results,
            standings, and historical classifications are protected.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminStatusBadge status={manufacturer.archivedAt ? "locked" : "ready"} />
          {manufacturer.websiteUrl ? (
            <Link
              href={manufacturer.websiteUrl}
              target="_blank"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Website
            </Link>
          ) : null}
        </div>
      </section>

      <ManufacturerMessage code={query?.error ?? query?.saved} />

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_320px] 2xl:items-start">
        <Card className="min-w-0 p-4 sm:p-5">
          <h2 className="text-xl font-black">Manufacturer editor</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            {canManage
              ? "Changes are validated and written with audit history."
              : "Reviewer access is read-only."}
          </p>
          <EventEditorForm action={updateAdminManufacturer} className="mt-5 grid gap-4">
            <input type="hidden" name="manufacturerId" value={manufacturer.id} />
            <div className="grid min-w-0 gap-3 lg:grid-cols-2">
              <TextField
                label="Name"
                name="name"
                defaultValue={manufacturer.name}
                disabled={!canManage}
              />
              <TextField
                label="Slug"
                name="slug"
                defaultValue={manufacturer.slug}
                disabled={!canManage}
              />
              <SelectField
                label="Country"
                name="countryId"
                defaultValue={manufacturer.countryId ?? ""}
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
                label="Founded Year"
                name="foundedYear"
                type="number"
                defaultValue={manufacturer.foundedYear?.toString() ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Website"
                name="websiteUrl"
                defaultValue={manufacturer.websiteUrl ?? ""}
                disabled={!canManage}
              />
              <SelectField
                label="Status"
                name="status"
                defaultValue={manufacturer.status}
                disabled={!canManage}
              >
                {options.status.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Visibility"
                name="visibility"
                defaultValue={manufacturer.visibility}
                disabled={!canManage}
              >
                {options.visibility.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {visibility}
                  </option>
                ))}
              </SelectField>
              <div className="lg:col-span-2">
                <TextArea
                  label="Description"
                  name="description"
                  defaultValue={manufacturer.description ?? ""}
                  disabled={!canManage}
                />
              </div>
              <div className="lg:col-span-2">
                <ImageUploadField
                  label="Manufacturer Logo"
                  name="logoUrl"
                  defaultValue={manufacturer.logoUrl}
                  disabled={!canManage}
                  entityId={manufacturer.id}
                  entityIdFieldName="manufacturerId"
                  entityLabel="manufacturer"
                  assetDescription="manufacturer logo"
                  uploadEndpoint="/admin/manufacturers/media"
                  help="Upload an approved manufacturer logo, or use the advanced URL field."
                />
              </div>
            </div>
            {canManage ? (
              <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-card/95 p-4 backdrop-blur sm:-mx-5">
                <EventSubmitButton
                  label="Save Manufacturer"
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
              <Meta label="ID" value={manufacturer.id} />
              <Meta label="Country" value={manufacturer.country?.name ?? "Unassigned"} />
              <Meta label="Created" value={formatDate(manufacturer.createdAt)} />
              <Meta label="Last Updated" value={formatDate(manufacturer.updatedAt)} />
              <Meta
                label="Archived"
                value={
                  manufacturer.archivedAt ? formatDate(manufacturer.archivedAt) : "No"
                }
              />
              <Meta label="Motorcycles" value={manufacturer.motorcycles.length} />
              <Meta label="Teams" value={manufacturer.teams.length} />
              <Meta label="Results" value={manufacturer.results.length} />
              <Meta label="Standings Stats" value={manufacturer.seasonStats.length} />
            </div>
          </Card>

          <Card className="min-w-0 p-4">
            <h2 className="text-xl font-black">Archive</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
              Archiving preserves all historical data and only removes this profile from
              active CMS lists.
            </p>
            {canManage && !manufacturer.archivedAt ? (
              <form action={archiveAdminManufacturer} className="mt-5 grid gap-3">
                <input type="hidden" name="manufacturerId" value={manufacturer.id} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="confirmArchive" />
                  Confirm archive
                </label>
                <EventSubmitButton
                  label="Archive Manufacturer"
                  pendingLabel="Archiving..."
                  icon="archive"
                  tone="danger"
                />
              </form>
            ) : canManage && manufacturer.archivedAt ? (
              <form action={restoreAdminManufacturer} className="mt-5 grid gap-3">
                <input type="hidden" name="manufacturerId" value={manufacturer.id} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="confirmRestore" />
                  Confirm restore as draft
                </label>
                <EventSubmitButton
                  label="Restore Manufacturer"
                  pendingLabel="Restoring..."
                  icon="restore"
                  tone="neutral"
                />
              </form>
            ) : (
              <p className="mt-4 text-sm text-foreground/[0.58]">
                {manufacturer.archivedAt
                  ? "This manufacturer is archived."
                  : "Read-only access."}
              </p>
            )}
          </Card>

          <Card className="min-w-0 border-red-500/25 p-4">
            <h2 className="text-xl font-black text-red-200">Danger Zone</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
              Permanent deletion is OWNER-only and blocked when protected dependencies
              exist.
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
              <form
                action={permanentlyDeleteAdminManufacturer}
                className="mt-5 grid gap-4"
              >
                <input type="hidden" name="manufacturerId" value={manufacturer.id} />
                <TextField
                  label="Type manufacturer slug or exact name"
                  name="deleteConfirmation"
                  defaultValue=""
                  disabled={!deleteEligibility.eligible}
                />
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
                    Deletion Reason
                  </span>
                  <textarea
                    name="deleteReason"
                    rows={3}
                    disabled={!deleteEligibility.eligible}
                    className="min-w-0 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm disabled:opacity-60"
                  />
                </label>
                <label className="flex items-start gap-2 text-sm text-foreground/[0.66]">
                  <input
                    type="checkbox"
                    name="confirmPermanentDelete"
                    disabled={!deleteEligibility.eligible}
                    className="mt-1 accent-red-500"
                  />
                  I understand this permanently deletes only this eligible manual/test
                  manufacturer.
                </label>
                <EventSubmitButton
                  label="Permanently Delete Manufacturer"
                  pendingLabel="Deleting..."
                  icon="trash"
                  disabled={!deleteEligibility.eligible}
                  tone="danger"
                />
              </form>
            ) : (
              <p className="mt-4 text-sm text-foreground/[0.58]">
                Only OWNER users can permanently delete eligible manual/test
                manufacturers.
              </p>
            )}
          </Card>
        </aside>
      </div>

      <Card className="min-w-0 overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Audit history</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            Immutable manufacturer metadata changes recorded through DataVersion.
          </p>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-fixed text-left text-[13px] sm:text-sm">
            <thead className="bg-black text-[10px] uppercase tracking-[0.12em] text-white/[0.64] sm:text-xs">
              <tr>
                <th className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  Action
                </th>
                <th className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  User
                </th>
                <th className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  Timestamp
                </th>
                <th className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                  Changed Fields
                </th>
              </tr>
            </thead>
            <tbody>
              {audit.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                    {item.action}
                  </td>
                  <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                    <div className="font-semibold">
                      {item.actor?.displayName ?? item.actor?.email ?? "System"}
                    </div>
                    <div className="mt-1 break-all text-xs text-foreground/[0.48]">
                      {item.actor?.email ?? item.createdBy ?? "System"}
                    </div>
                  </td>
                  <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 text-foreground/[0.66] sm:px-3">
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

function TextArea({
  label,
  name,
  defaultValue,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </span>
      <textarea
        name={name}
        rows={4}
        defaultValue={defaultValue}
        disabled={disabled}
        className="min-w-0 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm disabled:opacity-60"
      />
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

function ManufacturerMessage({ code }: { code?: string }) {
  if (!code) return null;
  const isSuccess = ["created", "updated", "archived", "restored"].includes(code);
  const message =
    code === "created"
      ? "✓ Manufacturer created successfully"
      : code === "updated"
        ? "✓ Changes saved successfully"
        : code === "archived"
          ? "✓ Manufacturer archived successfully"
          : code === "restored"
            ? "✓ Manufacturer restored successfully"
            : code === "slug-exists"
              ? "Another manufacturer already uses this slug."
              : code === "delete-blocked"
                ? "This manufacturer cannot be permanently deleted because protected dependencies exist."
                : code === "unauthorized"
                  ? "You do not have permission to modify manufacturers."
                  : "Please review the manufacturer form and try again.";
  return <EventAlert tone={isSuccess ? "success" : "error"}>{message}</EventAlert>;
}

function formatChangedFields(value: unknown) {
  if (!value || typeof value !== "object" || !("changedFields" in value)) {
    return "Full record";
  }
  const fields = (value as { changedFields?: unknown }).changedFields;
  return Array.isArray(fields) && fields.length ? fields.join(", ") : "No fields";
}
