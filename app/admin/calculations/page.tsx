import type { Metadata } from "next";
import { AlertTriangle, Calculator, Clock, ListChecks, Trophy } from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import { getCalculationsAdminData } from "@/db/calculations";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calculations",
  description: "Preview-only standings recalculation foundation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminCalculationsPage() {
  const data = await getCalculationsAdminData();
  const topPreviewRows = data.preview.standings.slice(0, 8);

  return (
    <div className="grid gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Calculations
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">
            Standings recalculation foundation
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Preview-only calculation engine for transforming approved race results into
            future rider, manufacturer, team, and season rankings. Nothing on this page
            writes to the database.
          </p>
        </div>
        <AdminStatusBadge status="review" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          label="Last Run"
          value={
            data.latestCalculationRun
              ? formatDate(data.latestCalculationRun.startedAt)
              : "None"
          }
          detail="Preview foundation only"
          icon={Clock}
        />
        <AdminStatCard
          label="Pending Recalcs"
          value={data.pendingRecalculations}
          detail="Awaiting future approval flow"
          icon={Calculator}
        />
        <AdminStatCard
          label="Seasons Affected"
          value={data.affectedSeasons.length}
          detail="Seasons with result rows"
          icon={Trophy}
        />
        <AdminStatCard
          label="Results Pending"
          value={data.pendingResultImports}
          detail="Official results needing review"
          icon={AlertTriangle}
        />
        <AdminStatCard
          label="Validation Issues"
          value={data.preview.validationIssues.length}
          detail="Preview input checks"
          icon={ListChecks}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-6">
          <h2 className="text-xl font-black">Points systems</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            Typed configurations are ready for FIM-style, legacy, and custom points
            tables. The current preview uses FIM style.
          </p>
          <div className="mt-5 grid gap-3">
            {data.pointsSystems.map((system) => (
              <div
                key={system.id}
                className="rounded-md border border-border bg-surface-muted p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold">{system.name}</p>
                  <AdminStatusBadge
                    status={
                      system.id === data.preview.pointsSystemId ? "ready" : "locked"
                    }
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
                  {system.description}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black">Validation rules</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            The foundation already checks for duplicate rider results, duplicate event
            positions, missing points, invalid positions, and missing riders.
          </p>
          <div className="mt-5 grid gap-3">
            {data.preview.validationIssues.length > 0 ? (
              data.preview.validationIssues.map((issue) => (
                <div
                  key={`${issue.code}-${issue.message}`}
                  className="rounded-md border border-border bg-surface-muted p-4"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-accent">
                    {issue.severity} / {issue.code}
                  </p>
                  <p className="mt-2 text-sm text-foreground/[0.68]">{issue.message}</p>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-border bg-surface-muted p-4 text-sm text-foreground/[0.62]">
                No validation issues in the current demo preview.
              </div>
            )}
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Standings preview</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            Current points compared with proposed points from approved-result-style demo
            calculations. This table is preview-only and does not publish standings.
          </p>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-fixed text-left text-[13px] sm:text-sm">
            <thead className="bg-black text-[10px] uppercase tracking-[0.12em] text-white/[0.64] sm:text-xs">
              <tr>
                {[
                  "Rider",
                  "Current Pos",
                  "Proposed Pos",
                  "Current Points",
                  "Proposed Points",
                  "Difference",
                  "Wins",
                  "Podiums",
                  "Starts",
                  "DNFs",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="min-w-0 px-2 py-3 align-bottom leading-5 font-semibold sm:px-3"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topPreviewRows.map((row) => (
                <tr key={row.riderId} className="border-t border-border">
                  <td className="min-w-0 px-2 py-3 align-bottom leading-5 font-semibold sm:px-3">
                    {row.riderName}
                  </td>
                  <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                    {row.currentPosition ?? "-"}
                  </td>
                  <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                    {row.proposedPosition}
                  </td>
                  <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                    {row.currentPoints}
                  </td>
                  <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                    {row.proposedPoints}
                  </td>
                  <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 text-accent sm:px-3">
                    {row.pointsDifference > 0 ? "+" : ""}
                    {row.pointsDifference}
                  </td>
                  <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                    {row.wins}
                  </td>
                  <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                    {row.podiums}
                  </td>
                  <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                    {row.starts}
                  </td>
                  <td className="min-w-0 whitespace-normal break-words px-2 py-3 align-top leading-6 sm:px-3">
                    {row.dnfs}
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
