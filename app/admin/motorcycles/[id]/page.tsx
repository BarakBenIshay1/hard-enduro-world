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
  archiveAdminMotorcycle,
  permanentlyDeleteAdminMotorcycle,
  restoreAdminMotorcycle,
  updateAdminMotorcycle,
} from "@/app/admin/motorcycles/actions";
import {
  getAdminMotorcycleAudit,
  getAdminMotorcycleDeleteEligibility,
  getAdminMotorcycleDetail,
  getAdminMotorcycleOptions,
} from "@/db/admin-motorcycles";
import { getAdminAccessContext } from "@/lib/admin/access";
import {
  canManageMotorcycles,
  canPermanentlyDeleteMotorcycles,
} from "@/lib/admin/motorcycle-cms";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; saved?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const motorcycle = await getAdminMotorcycleDetail(id);
  return {
    title: motorcycle ? motorcycle.model : "Motorcycle",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminMotorcycleDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, query, access, options] = await Promise.all([
    params,
    searchParams,
    getAdminAccessContext(),
    getAdminMotorcycleOptions(),
  ]);
  const [motorcycle, audit, deleteEligibility] = await Promise.all([
    getAdminMotorcycleDetail(id),
    getAdminMotorcycleAudit(id),
    getAdminMotorcycleDeleteEligibility(id),
  ]);

  if (!motorcycle) notFound();

  const canManage = canManageMotorcycles(access.role);
  const canDelete = canPermanentlyDeleteMotorcycles(access.role);
  const displayName = `${motorcycle.manufacturer.name} ${motorcycle.model}`;

  return (
    <div className="grid min-w-0 gap-6 overflow-x-hidden">
      <section className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/motorcycles"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
          >
            Back to motorcycles
          </Link>
          <h1 className="mt-3 break-words text-3xl font-black lg:text-4xl">
            {displayName}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Edit motorcycle profile and technical specification metadata only. Results,
            rider assignments, and historical classifications remain protected.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminStatusBadge status={motorcycle.archivedAt ? "locked" : "ready"} />
          <Link
            href={`/motorcycles/${motorcycle.slug}`}
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Public Page
          </Link>
        </div>
      </section>

      <MotorcycleMessage code={query?.error ?? query?.saved} />

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_320px] 2xl:items-start">
        <Card className="min-w-0 p-4 sm:p-5">
          <h2 className="text-xl font-black">Motorcycle editor</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            {canManage
              ? "Changes are validated and written with audit history."
              : "Reviewer access is read-only."}
          </p>
          <EventEditorForm action={updateAdminMotorcycle} className="mt-5 grid gap-4">
            <input type="hidden" name="motorcycleId" value={motorcycle.id} />
            <div className="grid min-w-0 gap-3 lg:grid-cols-2">
              <SelectField
                label="Manufacturer"
                name="manufacturerId"
                defaultValue={motorcycle.manufacturerId}
                disabled={!canManage}
              >
                <option value={motorcycle.manufacturerId}>
                  {motorcycle.manufacturer.name}
                </option>
                {options.manufacturers
                  .filter((manufacturer) => manufacturer.id !== motorcycle.manufacturerId)
                  .map((manufacturer) => (
                    <option key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </option>
                  ))}
              </SelectField>
              <TextField
                label="Model"
                name="model"
                defaultValue={motorcycle.model}
                disabled={!canManage}
              />
              <TextField
                label="Slug"
                name="slug"
                defaultValue={motorcycle.slug}
                disabled={!canManage}
              />
              <TextField
                label="Model Year"
                name="year"
                type="number"
                defaultValue={motorcycle.year?.toString() ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Displacement (cc)"
                name="engineCc"
                type="number"
                defaultValue={motorcycle.engineCc?.toString() ?? ""}
                disabled={!canManage}
              />
              <SelectField
                label="Stroke"
                name="strokeType"
                defaultValue={motorcycle.strokeType ?? ""}
                disabled={!canManage}
              >
                <option value="">Unassigned</option>
                {options.strokeTypes.map((stroke) => (
                  <option key={stroke} value={stroke}>
                    {stroke}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Weight (kg)"
                name="weightKg"
                type="number"
                step="0.1"
                defaultValue={motorcycle.weightKg?.toString() ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Power (hp)"
                name="horsepower"
                type="number"
                step="0.1"
                defaultValue={motorcycle.horsepower?.toString() ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Torque (Nm)"
                name="torqueNm"
                type="number"
                step="0.1"
                defaultValue={motorcycle.torqueNm?.toString() ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Fuel Capacity (liters)"
                name="fuelCapacityL"
                type="number"
                step="0.1"
                defaultValue={motorcycle.fuelCapacityL?.toString() ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Front Suspension"
                name="suspensionFront"
                defaultValue={motorcycle.suspensionFront ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Rear Suspension"
                name="suspensionRear"
                defaultValue={motorcycle.suspensionRear ?? ""}
                disabled={!canManage}
              />
              <TextField
                label="Transmission"
                name="transmission"
                defaultValue={motorcycle.transmission ?? ""}
                disabled={!canManage}
              />
              <SelectField
                label="Status"
                name="status"
                defaultValue={motorcycle.status}
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
                defaultValue={motorcycle.visibility}
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
                  label="Technical Description"
                  name="description"
                  defaultValue={motorcycle.description ?? ""}
                  disabled={!canManage}
                />
              </div>
              <div className="lg:col-span-2">
                <ImageUploadField
                  label="Motorcycle Hero Image"
                  name="heroImage"
                  defaultValue={motorcycle.heroImage}
                  disabled={!canManage}
                  entityId={motorcycle.id}
                  entityIdFieldName="motorcycleId"
                  entityLabel="motorcycle"
                  assetDescription="motorcycle hero image"
                  uploadEndpoint="/admin/motorcycles/media"
                  help="Upload an approved motorcycle hero image, or use the advanced URL field."
                />
              </div>
            </div>
            {canManage ? (
              <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-card/95 p-4 backdrop-blur sm:-mx-5">
                <EventSubmitButton
                  label="Save Motorcycle"
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
              <Meta label="ID" value={motorcycle.id} />
              <Meta label="Manufacturer" value={motorcycle.manufacturer.name} />
              <Meta label="Created" value={formatDate(motorcycle.createdAt)} />
              <Meta label="Last Updated" value={formatDate(motorcycle.updatedAt)} />
              <Meta
                label="Archived"
                value={motorcycle.archivedAt ? formatDate(motorcycle.archivedAt) : "No"}
              />
              <Meta label="Current Riders" value={motorcycle.currentRiders.length} />
              <Meta label="Results" value={motorcycle.results.length} />
              <Meta label="Stage Results" value={motorcycle.stageResults.length} />
              <Meta label="Season Stats" value={motorcycle.seasonStats.length} />
            </div>
          </Card>

          <Card className="min-w-0 p-4">
            <h2 className="text-xl font-black">Archive</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
              Archiving preserves all relationships and removes this motorcycle from
              public and active CMS lists.
            </p>
            {canManage && !motorcycle.archivedAt ? (
              <form action={archiveAdminMotorcycle} className="mt-5 grid gap-3">
                <input type="hidden" name="motorcycleId" value={motorcycle.id} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="confirmArchive" />
                  Confirm archive
                </label>
                <EventSubmitButton
                  label="Archive Motorcycle"
                  pendingLabel="Archiving..."
                  icon="archive"
                  tone="danger"
                />
              </form>
            ) : canManage && motorcycle.archivedAt ? (
              <form action={restoreAdminMotorcycle} className="mt-5 grid gap-3">
                <input type="hidden" name="motorcycleId" value={motorcycle.id} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="confirmRestore" />
                  Confirm restore as draft
                </label>
                <EventSubmitButton
                  label="Restore Motorcycle"
                  pendingLabel="Restoring..."
                  icon="restore"
                  tone="neutral"
                />
              </form>
            ) : (
              <p className="mt-4 text-sm text-foreground/[0.58]">
                {motorcycle.archivedAt
                  ? "This motorcycle is archived."
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
              <form action={permanentlyDeleteAdminMotorcycle} className="mt-5 grid gap-4">
                <input type="hidden" name="motorcycleId" value={motorcycle.id} />
                <TextField
                  label="Type motorcycle slug or exact model"
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
                  motorcycle.
                </label>
                <EventSubmitButton
                  label="Permanently Delete Motorcycle"
                  pendingLabel="Deleting..."
                  icon="trash"
                  disabled={!deleteEligibility.eligible}
                  tone="danger"
                />
              </form>
            ) : (
              <p className="mt-4 text-sm text-foreground/[0.58]">
                Only OWNER users can permanently delete eligible manual/test motorcycles.
              </p>
            )}
          </Card>
        </aside>
      </div>

      <Card className="min-w-0 overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Audit history</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            Immutable motorcycle metadata changes recorded through DataVersion.
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
                  Actor
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
              {audit.map((item) => {
                const next = item.next as { changedFields?: string[] } | null;
                return (
                  <tr key={item.id} className="border-t border-border">
                    <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top font-semibold leading-6 sm:px-3">
                      {item.action}
                    </td>
                    <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 text-foreground/[0.66] sm:px-3">
                      {item.actor?.displayName ?? item.actor?.email ?? "System"}
                    </td>
                    <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 text-foreground/[0.66] sm:px-3">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 text-foreground/[0.66] sm:px-3">
                      {next?.changedFields?.join(", ") ?? "Initial record"}
                    </td>
                  </tr>
                );
              })}
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
  step,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  disabled?: boolean;
  step?: string;
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        disabled={disabled}
        className="h-10 min-w-0 rounded-md border border-border bg-surface-muted px-3 text-sm disabled:opacity-60"
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
        className="h-10 min-w-0 rounded-md border border-border bg-surface-muted px-3 text-sm disabled:opacity-60"
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
        rows={5}
        defaultValue={defaultValue}
        disabled={disabled}
        className="min-w-0 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm disabled:opacity-60"
      />
    </label>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.42]">
        {label}
      </span>
      <span className="break-words font-semibold">{value}</span>
    </div>
  );
}

function MotorcycleMessage({ code }: { code?: string }) {
  if (!code) return null;
  const success = ["created", "updated", "archived", "restored"].includes(code);
  const message =
    code === "created"
      ? "Motorcycle created."
      : code === "updated"
        ? "Motorcycle saved."
        : code === "archived"
          ? "Motorcycle archived."
          : code === "restored"
            ? "Motorcycle restored as draft."
            : code === "slug-exists"
              ? "Another motorcycle already uses this slug."
              : code === "manufacturer-required"
                ? "Choose an active manufacturer."
                : code === "manufacturer-archived"
                  ? "Archived manufacturers cannot be selected for motorcycles."
                  : code === "delete-blocked"
                    ? "This motorcycle has protected dependencies and cannot be deleted."
                    : code === "delete-confirmation-mismatch"
                      ? "Deletion confirmation did not match the motorcycle model or slug."
                      : code === "delete-reason-required"
                        ? "A deletion reason is required."
                        : code === "invalid-number"
                          ? "Technical numeric fields must contain numbers only."
                          : code === "invalid-hero-image"
                            ? "Hero image URL must be a valid http or https URL."
                            : "Please review the form fields and try again.";
  return <EventAlert tone={success ? "success" : "error"}>{message}</EventAlert>;
}
