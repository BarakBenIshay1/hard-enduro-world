import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EventAlert } from "@/components/admin/events/event-alert";
import { EventSubmitButton } from "@/components/admin/events/event-submit-button";
import { ImageUploadField } from "@/components/admin/media/image-upload-field";
import { getAdminAccessContext } from "@/lib/admin/access";
import { canManageTeams } from "@/lib/admin/team-cms";
import { getAdminTeamOptions } from "@/db/admin-teams";
import { createAdminTeam } from "@/app/admin/teams/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Team",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function NewAdminTeamPage({ searchParams }: PageProps) {
  const [access, options, query] = await Promise.all([
    getAdminAccessContext(),
    getAdminTeamOptions(),
    searchParams,
  ]);
  const canManage = canManageTeams(access.role);

  return (
    <div className="grid min-w-0 gap-6">
      <section>
        <Link
          href="/admin/teams"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
        >
          Back to teams
        </Link>
        <h1 className="mt-3 text-3xl font-black lg:text-5xl">New Team</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Create a manually managed team profile. This does not create riders, results,
          standings, or historical classifications.
        </p>
      </section>

      <TeamMessage code={query?.error} />

      <Card className="p-5">
        {canManage ? (
          <form action={createAdminTeam} className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <Field label="Team Name" name="name" required />
              <Field label="Slug" name="slug" placeholder="Auto-generated if blank" />
              <SelectField label="Country" name="countryId">
                <option value="">Unassigned</option>
                {options.countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name} ({country.isoCode})
                  </option>
                ))}
              </SelectField>
              <SelectField label="Manufacturer" name="manufacturerId">
                <option value="">Independent</option>
                {options.manufacturers.map((manufacturer) => (
                  <option key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </option>
                ))}
              </SelectField>
              <Field label="Official Website" name="officialUrl" />
              <Field label="Team Manager" name="managerName" />
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
                <TextArea label="Description" name="description" />
              </div>
              <div className="lg:col-span-2">
                <ImageUploadField
                  label="Team Logo"
                  name="logoUrl"
                  uploadEndpoint="/admin/teams/media"
                  entityIdFieldName="teamId"
                  entityLabel="team"
                  assetDescription="team logo"
                  help="Create the team first, then upload the approved logo from the editor. Advanced URL remains available."
                />
              </div>
              <div className="lg:col-span-2">
                <TextArea
                  label="Gallery Images"
                  name="galleryImages"
                  help="Future-ready. Add one approved image URL per line."
                />
              </div>
            </div>
            <EventSubmitButton
              label="Create Team"
              pendingLabel="Creating..."
              icon="plus"
            />
          </form>
        ) : (
          <p className="text-sm text-foreground/[0.62]">
            You have read-only access and cannot create teams.
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

function SelectField({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
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
        className="h-10 rounded-md border border-border bg-surface-muted px-3 text-sm"
      >
        {children}
      </select>
    </label>
  );
}

function TextArea({ label, name, help }: { label: string; name: string; help?: string }) {
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
      {help ? <span className="text-xs text-foreground/[0.48]">{help}</span> : null}
    </label>
  );
}

function TeamMessage({ code }: { code?: string }) {
  if (!code) return null;
  const message =
    code === "slug-exists"
      ? "Another team already uses this slug."
      : code === "invalid-official-url"
        ? "Official website must be a valid http or https URL."
        : code === "invalid-logo-url"
          ? "Logo URL must be a valid http or https URL."
          : code === "invalid-gallery-image"
            ? "Gallery image URLs must be valid http or https URLs."
            : code === "unauthorized"
              ? "You do not have permission to create teams."
              : "Please review the form fields and try again.";
  return <EventAlert tone="error">{message}</EventAlert>;
}
