import type { Metadata } from "next";
import Link from "next/link";
import { Eye } from "lucide-react";
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
import { EventSubmitButton } from "@/components/admin/events/event-submit-button";
import { Card } from "@/components/ui/card";
import { createStandingCalculationReview } from "@/app/admin/standings/actions";
import { getAdminStandings, type AdminStandingListFilters } from "@/db/admin-standings";
import { pointsSystems } from "@/jobs/calculations/points-system";
import { parseAdminPage } from "@/lib/admin/platform";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Standings CMS",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminStandingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const data = await getAdminStandings(filters);

  return (
    <div className="grid min-w-0 gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Admin Standings
        </p>
        <h1 className="mt-2 text-3xl font-black lg:text-5xl">Standings CMS</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Calculate rider standings from active persisted Results, create review
          proposals, approve them in Import Review, then explicitly apply them to persist.
        </p>
      </section>

      <StandingMessage code={value(params, "error") ?? value(params, "saved")} />

      <Card className="p-5">
        <form
          action={createStandingCalculationReview}
          className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end"
        >
          <Field label="Season">
            <select
              name="seasonId"
              required
              defaultValue={filters.seasonId ?? data.options.seasons[0]?.id ?? ""}
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            >
              {data.options.seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Points Source">
            <select
              name="pointsSystemId"
              defaultValue="source-result-points"
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            >
              {pointsSystems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-xs text-foreground/[0.66]">
              <input type="checkbox" name="confirmCalculation" required />
              Create review proposals
            </label>
            <EventSubmitButton
              label="Calculate for Review"
              pendingLabel="Calculating..."
              icon="save"
            />
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <form className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] lg:items-end">
          <Field label="Search">
            <input
              name="search"
              defaultValue={filters.search ?? ""}
              placeholder="Rider, season, class"
              className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
            />
          </Field>
          <Select name="seasonId" label="Season" value={filters.seasonId ?? ""}>
            <option value="">All seasons</option>
            {data.options.seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </Select>
          <Select name="riderId" label="Rider" value={filters.riderId ?? ""}>
            <option value="">All riders</option>
            {data.options.riders.map((rider) => (
              <option key={rider.id} value={rider.id}>
                {rider.firstName} {rider.lastName}
              </option>
            ))}
          </Select>
          <Select name="sort" label="Sort" value={filters.sort ?? "position-asc"}>
            <option value="position-asc">Position</option>
            <option value="points-desc">Points ↓</option>
            <option value="points-asc">Points ↑</option>
            <option value="updated-desc">Updated ↓</option>
            <option value="updated-asc">Updated ↑</option>
          </Select>
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
          <h2 className="text-xl font-black">Published standings</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            {data.total} standings found. Page {data.page} of {data.totalPages}.
          </p>
        </div>
        <div className={adminTableScrollClass}>
          <table className={adminCompactTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTablePrimaryCellClass}>Standing</th>
                <th className={adminTableHeaderCellClass}>Season</th>
                <th className={adminTableHeaderCellClass}>Points</th>
                <th className={adminTableHeaderCellClass}>Wins</th>
                <th className={adminTableHeaderCellClass}>Podiums</th>
                <th className={adminTableHeaderCellClass}>Starts</th>
                <th className={adminTableHeaderCellClass}>Updated</th>
                <th className={adminTableActionCellClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.standings.map((standing) => (
                <tr key={standing.id} className="border-t border-border">
                  <td className={adminTablePrimaryCellClass}>
                    <div className="font-semibold">
                      P{standing.position ?? "-"} {standing.rider.firstName}{" "}
                      {standing.rider.lastName}
                    </div>
                    <div className="mt-1 text-xs text-foreground/[0.48]">
                      Class {standing.className ?? "Overall"}
                    </div>
                  </td>
                  <td className={adminTableCellClass}>{standing.season.name}</td>
                  <td className={adminTableCellClass}>{standing.points}</td>
                  <td className={adminTableCellClass}>{standing.wins}</td>
                  <td className={adminTableCellClass}>{standing.podiums}</td>
                  <td className={adminTableMutedCellClass}>
                    Starts {standing.starts} / DNF {standing.dnfs}
                  </td>
                  <td className={adminTableCellClass}>
                    {formatDate(standing.updatedAt)}
                  </td>
                  <td className={adminTableActionCellClass}>
                    <Link
                      href={`/admin/standings/${standing.id}`}
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
): AdminStandingListFilters {
  return {
    search: value(params, "search"),
    seasonId: value(params, "seasonId"),
    riderId: value(params, "riderId"),
    page: parseAdminPage(value(params, "page")),
    sort: value(params, "sort") ?? "position-asc",
  };
}

function Pagination({
  filters,
  current,
  totalPages,
}: {
  filters: AdminStandingListFilters;
  current: number;
  totalPages: number;
}) {
  const previous = current - 1;
  const next = current + 1;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-foreground/[0.58]">
        Page {current} of {totalPages}
      </p>
      <div className="flex gap-2">
        <PageLink disabled={current <= 1} page={previous} filters={filters}>
          Previous
        </PageLink>
        <PageLink disabled={current >= totalPages} page={next} filters={filters}>
          Next
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  disabled,
  page,
  filters,
  children,
}: {
  disabled: boolean;
  page: number;
  filters: AdminStandingListFilters;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries({ ...filters, page })) {
    if (rawValue !== undefined && rawValue !== "") params.set(key, String(rawValue));
  }
  return disabled ? (
    <span className="rounded-md border border-border px-4 py-2 text-sm text-foreground/[0.4]">
      {children}
    </span>
  ) : (
    <Link
      href={`/admin/standings?${params.toString()}`}
      className="rounded-md border border-border px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
    >
      {children}
    </Link>
  );
}

function Select({
  name,
  label,
  value,
  children,
}: {
  name: string;
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Field label={label}>
      <select
        name={name}
        defaultValue={value}
        className="h-10 w-full rounded-md border border-border bg-surface-muted px-3 text-sm"
      >
        {children}
      </select>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.54]">
        {label}
      </span>
      {children}
    </label>
  );
}

function StandingMessage({ code }: { code?: string }) {
  if (!code) return null;
  const messages: Record<string, string> = {
    "calculation-created": "Calculation review proposals were created.",
    unauthorized: "You do not have permission to calculate standings.",
    "calculation-confirmation": "Confirm the calculation review before submitting.",
    "calculation-failed": "The calculation could not be created.",
  };
  return (
    <EventAlert tone={code === "calculation-created" ? "success" : "error"}>
      {messages[code] ?? code}
    </EventAlert>
  );
}

function value(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const raw = params?.[key];
  return typeof raw === "string" ? raw : undefined;
}
