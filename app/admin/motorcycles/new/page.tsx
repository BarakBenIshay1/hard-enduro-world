import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EventAlert } from "@/components/admin/events/event-alert";
import { EventSubmitButton } from "@/components/admin/events/event-submit-button";
import { ImageUploadField } from "@/components/admin/media/image-upload-field";
import { getAdminAccessContext } from "@/lib/admin/access";
import { canManageMotorcycles } from "@/lib/admin/motorcycle-cms";
import { getAdminMotorcycleOptions } from "@/db/admin-motorcycles";
import { createAdminMotorcycle } from "@/app/admin/motorcycles/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Motorcycle",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function NewAdminMotorcyclePage({ searchParams }: PageProps) {
  const [access, options, query] = await Promise.all([
    getAdminAccessContext(),
    getAdminMotorcycleOptions(),
    searchParams,
  ]);
  const canManage = canManageMotorcycles(access.role);

  return (
    <div className="grid min-w-0 gap-6">
      <section>
        <Link
          href="/admin/motorcycles"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
        >
          Back to motorcycles
        </Link>
        <h1 className="mt-3 text-3xl font-black lg:text-5xl">New Motorcycle</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Create a manually managed motorcycle profile. Technical values are stored in cc,
          kg, hp, Nm, and liters without automatic unit conversion.
        </p>
      </section>

      <MotorcycleMessage code={query?.error} />

      <Card className="p-5">
        {canManage ? (
          <form action={createAdminMotorcycle} className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <SelectField label="Manufacturer" name="manufacturerId" required>
                <option value="">Select manufacturer</option>
                {options.manufacturers.map((manufacturer) => (
                  <option key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </option>
                ))}
              </SelectField>
              <Field label="Model" name="model" required />
              <Field label="Slug" name="slug" placeholder="Auto-generated if blank" />
              <Field label="Model Year" name="year" type="number" />
              <Field label="Displacement (cc)" name="engineCc" type="number" />
              <SelectField label="Stroke" name="strokeType">
                <option value="">Unassigned</option>
                {options.strokeTypes.map((stroke) => (
                  <option key={stroke} value={stroke}>
                    {stroke}
                  </option>
                ))}
              </SelectField>
              <Field label="Weight (kg)" name="weightKg" type="number" step="0.1" />
              <Field label="Power (hp)" name="horsepower" type="number" step="0.1" />
              <Field label="Torque (Nm)" name="torqueNm" type="number" step="0.1" />
              <Field
                label="Fuel Capacity (liters)"
                name="fuelCapacityL"
                type="number"
                step="0.1"
              />
              <Field label="Front Suspension" name="suspensionFront" />
              <Field label="Rear Suspension" name="suspensionRear" />
              <Field label="Transmission" name="transmission" />
              <SelectField label="Status" name="status" defaultValue="ACTIVE">
                {options.status.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Visibility" name="visibility" defaultValue="DRAFT">
                {options.visibility.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {visibility}
                  </option>
                ))}
              </SelectField>
              <div className="lg:col-span-2">
                <TextArea label="Technical Description" name="description" />
              </div>
              <div className="lg:col-span-2">
                <ImageUploadField
                  label="Motorcycle Hero Image"
                  name="heroImage"
                  uploadEndpoint="/admin/motorcycles/media"
                  entityIdFieldName="motorcycleId"
                  entityLabel="motorcycle"
                  assetDescription="motorcycle hero image"
                  help="Create the motorcycle first, then upload the approved hero image from the editor. Advanced URL remains available."
                />
              </div>
            </div>
            <EventSubmitButton
              label="Create Motorcycle"
              pendingLabel="Creating..."
              icon="plus"
            />
          </form>
        ) : (
          <p className="text-sm text-foreground/[0.62]">
            You have read-only access and cannot create motorcycles.
          </p>
        )}
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        step={step}
        className="h-10 min-w-0 rounded-md border border-border bg-surface-muted px-3 text-sm"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  required,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="h-10 rounded-md border border-border bg-surface-muted px-3 text-sm"
      >
        {children}
      </select>
    </label>
  );
}

function TextArea({ label, name }: { label: string; name: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </span>
      <textarea
        name={name}
        rows={4}
        className="min-w-0 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
      />
    </label>
  );
}

function MotorcycleMessage({ code }: { code?: string }) {
  if (!code) return null;
  const message =
    code === "slug-exists"
      ? "Another motorcycle already uses this slug."
      : code === "manufacturer-required"
        ? "Choose an active manufacturer."
        : code === "manufacturer-archived"
          ? "Archived manufacturers cannot be selected for new motorcycles."
          : code === "invalid-number"
            ? "Technical numeric fields must contain numbers only."
            : code === "invalid-model-year"
              ? "Model year must be within a realistic range."
              : code === "invalid-hero-image"
                ? "Hero image URL must be a valid http or https URL."
                : code === "unauthorized"
                  ? "You do not have permission to create motorcycles."
                  : "Please review the form fields and try again.";
  return <EventAlert tone="error">{message}</EventAlert>;
}
