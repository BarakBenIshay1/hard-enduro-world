import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EventAlert } from "@/components/admin/events/event-alert";
import { EventSubmitButton } from "@/components/admin/events/event-submit-button";
import { ImageUploadField } from "@/components/admin/media/image-upload-field";
import { getAdminAccessContext } from "@/lib/admin/access";
import { canManageRiders } from "@/lib/admin/rider-cms";
import { getAdminRiderOptions } from "@/db/admin-riders";
import { createAdminRider } from "@/app/admin/riders/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Rider",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function NewAdminRiderPage({ searchParams }: PageProps) {
  const [access, options, query] = await Promise.all([
    getAdminAccessContext(),
    getAdminRiderOptions(),
    searchParams,
  ]);
  const canManage = canManageRiders(access.role);

  return (
    <div className="grid min-w-0 gap-6">
      <section>
        <Link
          href="/admin/riders"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
        >
          Back to riders
        </Link>
        <h1 className="mt-3 text-3xl font-black lg:text-5xl">New Rider</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Create a manually managed rider profile. This does not create results,
          standings, or historical classifications.
        </p>
      </section>

      <RiderMessage code={query?.error} />

      <Card className="p-5">
        {canManage ? (
          <form action={createAdminRider} className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <Field label="First Name" name="firstName" required />
              <Field label="Last Name" name="lastName" required />
              <Field label="Slug" name="slug" placeholder="Auto-generated if blank" />
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
                  Country
                </span>
                <select
                  name="countryId"
                  className="h-10 rounded-md border border-border bg-surface-muted px-3 text-sm"
                >
                  <option value="">Unassigned</option>
                  {options.countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name} ({country.isoCode})
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
                  Current Motorcycle
                </span>
                <select
                  name="currentMotorcycleId"
                  className="h-10 rounded-md border border-border bg-surface-muted px-3 text-sm"
                >
                  <option value="">Unassigned</option>
                  {options.motorcycles.map((motorcycle) => (
                    <option key={motorcycle.id} value={motorcycle.id}>
                      {motorcycle.manufacturer.name} {motorcycle.model}
                      {motorcycle.year ? ` (${motorcycle.year})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Birth Date" name="birthDate" type="date" />
              <Field label="Official URL" name="officialUrl" />
              <div className="lg:col-span-2">
                <ImageUploadField
                  label="Profile Image"
                  name="profileImageUrl"
                  uploadEndpoint="/admin/riders/media"
                  help="Create the rider first, then upload the approved portrait from the editor. Advanced URL remains available."
                />
              </div>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
                  Visibility
                </span>
                <select
                  name="visibility"
                  defaultValue="DRAFT"
                  className="h-10 rounded-md border border-border bg-surface-muted px-3 text-sm"
                >
                  {options.visibility.map((visibility) => (
                    <option key={visibility} value={visibility}>
                      {visibility}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <EventSubmitButton
              label="Create Rider"
              pendingLabel="Creating..."
              icon="plus"
            />
          </form>
        ) : (
          <p className="text-sm text-foreground/[0.62]">
            You have read-only access and cannot create riders.
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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
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
        className="h-10 min-w-0 rounded-md border border-border bg-surface-muted px-3 text-sm"
      />
    </label>
  );
}

function RiderMessage({ code }: { code?: string }) {
  if (!code) return null;
  const message =
    code === "slug-exists"
      ? "Another rider already uses this slug."
      : code === "invalid-official-url"
        ? "Official URL must be a valid http or https URL."
        : code === "invalid-profile-image-url"
          ? "Profile image URL must be a valid http or https URL."
          : code === "unauthorized"
            ? "You do not have permission to create riders."
            : "Please review the form fields and try again.";
  return <EventAlert tone="error">{message}</EventAlert>;
}
