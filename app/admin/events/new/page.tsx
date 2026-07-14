import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { EventAlert } from "@/components/admin/events/event-alert";
import { EventSubmitButton } from "@/components/admin/events/event-submit-button";
import { Card } from "@/components/ui/card";
import { getAdminAccessContext } from "@/lib/admin/access";
import { getAdminEventOptions } from "@/db/admin-events";
import { createAdminEvent } from "@/app/admin/events/actions";
import { canManageEvents } from "@/lib/admin/event-cms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Event",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function NewAdminEventPage({ searchParams }: PageProps) {
  const [access, options, query] = await Promise.all([
    getAdminAccessContext(),
    getAdminEventOptions(),
    searchParams,
  ]);
  const canManage = canManageEvents(access.role);

  return (
    <div className="grid gap-8">
      <section>
        <Link
          href="/admin/events"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
        >
          Back to events
        </Link>
        <h1 className="mt-3 text-3xl font-black lg:text-5xl">New Event</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Create a manually managed event record. Every creation is audited.
        </p>
      </section>

      <EventMessage code={query?.error} />

      <Card className="p-6">
        {canManage ? (
          <form action={createAdminEvent} className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name" name="name" required />
              <Field
                label="Slug"
                name="slug"
                placeholder="Auto-generated from name if blank"
              />
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
                  Championship / Season
                </span>
                <select
                  name="seasonId"
                  required
                  className="h-10 rounded-md border border-border bg-surface-muted px-3 text-sm"
                >
                  <option value="">Select season</option>
                  {options.seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.year} · {season.name}
                    </option>
                  ))}
                </select>
              </label>
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
              <Field label="City" name="city" />
              <Field label="Venue" name="venue" />
              <Field label="Start Date" name="startDate" type="date" required />
              <Field label="End Date" name="endDate" type="date" />
              <Field label="Official URL" name="officialUrl" />
              <Field label="Organizer" name="organizer" />
              <Field label="Hero Image" name="heroImage" />
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
                  Status
                </span>
                <select
                  name="status"
                  defaultValue="SCHEDULED"
                  className="h-10 rounded-md border border-border bg-surface-muted px-3 text-sm"
                >
                  {options.statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
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
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
                Description
              </span>
              <textarea
                name="description"
                rows={6}
                className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.48]">
                Gallery Images
              </span>
              <textarea
                name="galleryImages"
                rows={4}
                className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
              />
              <span className="text-xs text-foreground/[0.48]">
                Add one approved image URL per line.
              </span>
            </label>
            <EventSubmitButton
              label="Create Event"
              pendingLabel="Creating..."
              icon={Plus}
            />
          </form>
        ) : (
          <p className="text-sm text-foreground/[0.62]">
            You have read-only access and cannot create events.
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
        className="h-10 rounded-md border border-border bg-surface-muted px-3 text-sm"
      />
    </label>
  );
}

function EventMessage({ code }: { code?: string }) {
  if (!code) return null;

  const message =
    code === "slug-exists"
      ? "Another event already uses this slug."
      : code === "invalid-date-range"
        ? "End date must be after start date."
        : code === "unauthorized"
          ? "You do not have permission to create events."
          : "Please review the form fields and try again.";

  return <EventAlert tone="error">{message}</EventAlert>;
}
