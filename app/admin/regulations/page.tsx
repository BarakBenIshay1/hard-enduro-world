import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import {
  createComponentRollupReview,
  createRegulationPointsReview,
} from "@/app/admin/regulations/actions";
import { getAdminRegulations } from "@/db/admin-regulations";
import { getAdminAccessContext, canAccessAdmin } from "@/lib/admin/access";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Championship Regulations",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminRegulationsPage({ searchParams }: PageProps) {
  const access = await getAdminAccessContext();
  if (!canAccessAdmin(access, "calculations:view")) notFound();
  const params = await searchParams;
  const regulations = await getAdminRegulations();

  return (
    <div className="grid min-w-0 gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Regulations
        </p>
        <h1 className="mt-2 text-3xl font-black lg:text-5xl">Championship regulations</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Manage verified official regulation sources before generating controlled
          Result.points review proposals.
        </p>
        {canAccessAdmin(access, "calculations:review") ? (
          <Link
            href="/admin/regulations/new"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-black text-black"
          >
            New Regulation
          </Link>
        ) : null}
      </section>

      <RegulationMessage code={value(params, "error") ?? value(params, "saved")} />

      <Card className={adminTableCardClass}>
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Verified regulation sources</h2>
          <p className="mt-2 text-sm text-foreground/[0.62]">
            {regulations.length} regulation records configured.
          </p>
        </div>
        <div className={adminTableScrollClass}>
          <table className={adminCompactTableClass}>
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTablePrimaryCellClass}>Regulation</th>
                <th className={adminTableHeaderCellClass}>Season</th>
                <th className={adminTableHeaderCellClass}>Scope</th>
                <th className={adminTableHeaderCellClass}>Version</th>
                <th className={adminTableHeaderCellClass}>Status</th>
                <th className={adminTableHeaderCellClass}>Validation</th>
                <th className={adminTableHeaderCellClass}>Verified</th>
                <th className={adminTableActionCellClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {regulations.map((regulation) => (
                <tr key={regulation.id} className="border-t border-border">
                  <td className={adminTablePrimaryCellClass}>
                    <div className="font-semibold">{regulation.title}</div>
                    <div className="mt-1 text-xs text-foreground/[0.48]">
                      {regulation.section}
                    </div>
                  </td>
                  <td className={adminTableCellClass}>{regulation.season.name}</td>
                  <td className={adminTableCellClass}>
                    {regulation.classificationScope}
                    {regulation.className ? ` · ${regulation.className}` : ""}
                  </td>
                  <td className={adminTableCellClass}>v{regulation.version}</td>
                  <td className={adminTableCellClass}>{regulation.status}</td>
                  <td className={adminTableMutedCellClass}>
                    {regulation.validationIssues.length
                      ? `${regulation.validationIssues.length} issue(s)`
                      : "Valid"}
                  </td>
                  <td className={adminTableCellClass}>
                    {formatDate(regulation.verificationDate)}
                  </td>
                  <td className={adminTableActionCellClass}>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/admin/regulations/${regulation.id}`}
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface-muted px-3 text-xs font-semibold transition hover:border-accent hover:text-accent"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        Open
                      </Link>
                      {regulation.status === "ACTIVE" &&
                      regulation.validationIssues.length === 0 &&
                      canAccessAdmin(access, "calculations:review") ? (
                        <form
                          action={createRegulationPointsReview}
                          className="grid gap-2"
                        >
                          <input
                            type="hidden"
                            name="regulationId"
                            value={regulation.id}
                          />
                          <label className="sr-only">
                            <input type="checkbox" name="confirmReview" defaultChecked />
                            Confirm review generation
                          </label>
                          <EventSubmitButton
                            label="Create Component Review"
                            pendingLabel="Creating..."
                            icon="save"
                          />
                        </form>
                      ) : null}
                      {regulation.status === "ACTIVE" &&
                      regulation.validationIssues.length === 0 &&
                      canAccessAdmin(access, "calculations:review") ? (
                        <form action={createComponentRollupReview} className="grid gap-2">
                          <input
                            type="hidden"
                            name="regulationId"
                            value={regulation.id}
                          />
                          <label className="sr-only">
                            <input type="checkbox" name="confirmReview" defaultChecked />
                            Confirm rollup review generation
                          </label>
                          <EventSubmitButton
                            label="Create Rollup Review"
                            pendingLabel="Creating..."
                            icon="save"
                          />
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {regulations.length === 0 ? (
          <div className="border-t border-border p-6 text-sm text-foreground/[0.62]">
            No verified official regulations are configured. Standings remain fail-closed
            until an official source is added.
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function RegulationMessage({ code }: { code?: string }) {
  if (!code) return null;
  if (code === "points-review-created") {
    return <EventAlert tone="success">Points review proposals created.</EventAlert>;
  }
  if (code === "rollup-review-created") {
    return <EventAlert tone="success">Rollup review proposals created.</EventAlert>;
  }
  return <EventAlert tone="error">Regulation action could not be completed.</EventAlert>;
}

function value(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const raw = params?.[key];
  return typeof raw === "string" ? raw : undefined;
}
