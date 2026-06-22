import {
  Bike,
  CalendarDays,
  ClipboardCheck,
  Database,
  Factory,
  Gauge,
  ListChecks,
  PlayCircle,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTableShell } from "@/components/admin/admin-table-shell";
import { Card } from "@/components/ui/card";
import { getAdminDashboardData } from "@/db/admin";
import { getAdminAccessContext } from "@/lib/admin/access";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [{ counts }, access] = await Promise.all([
    getAdminDashboardData(),
    getAdminAccessContext(),
  ]);

  const cards = [
    {
      label: "Events",
      value: counts.events,
      detail: "Calendar records",
      icon: CalendarDays,
    },
    { label: "Riders", value: counts.riders, detail: "Athlete profiles", icon: Users },
    { label: "Teams", value: counts.teams, detail: "Team records", icon: ShieldCheck },
    {
      label: "Manufacturers",
      value: counts.manufacturers,
      detail: "Factory brands",
      icon: Factory,
    },
    {
      label: "Motorcycles",
      value: counts.motorcycles,
      detail: "Machine profiles",
      icon: Bike,
    },
    {
      label: "Results",
      value: counts.results,
      detail: "Final classifications",
      icon: Trophy,
    },
    {
      label: "Standings",
      value: counts.standings,
      detail: "Points tables",
      icon: ListChecks,
    },
    {
      label: "Records",
      value: counts.records,
      detail: "Calculated records",
      icon: Trophy,
    },
    { label: "Sources", value: counts.sources, detail: "Source links", icon: Database },
    {
      label: "Pending Reviews",
      value: counts.pendingReviews,
      detail: "Import approvals",
      icon: ClipboardCheck,
    },
    {
      label: "Failed Imports",
      value: counts.failedImports,
      detail: "Needs inspection",
      icon: ClipboardCheck,
    },
    {
      label: "Latest Changes",
      value: counts.latestChanges,
      detail: "Audit entries",
      icon: Database,
    },
    {
      label: "Active Jobs",
      value: counts.activeJobs,
      detail: "Registry enabled",
      icon: PlayCircle,
    },
    {
      label: "Last Successful Import",
      value: counts.lastSuccessfulImport ? "Ready" : "Pending",
      detail: counts.lastSuccessfulImport
        ? counts.lastSuccessfulImport.toISOString().slice(0, 10)
        : "No completed imports",
      icon: Gauge,
    },
  ];

  return (
    <div className="grid gap-8">
      <section className="grid gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-black lg:text-5xl">Admin foundation</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
              A structured operations surface for future CRUD, source tracking, import
              review, audit history, and role-based data management.
            </p>
          </div>
          <AdminStatusBadge status="locked" />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <AdminStatCard key={card.label} {...card} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-foreground/[0.48]">
            Access Control Placeholder
          </p>
          <h2 className="mt-2 text-2xl font-black">Role-based permissions ready</h2>
          <p className="mt-3 text-sm leading-6 text-foreground/[0.62]">
            Current placeholder context grants the {access.role} role. Future Supabase
            Auth can replace this provider with owner, admin, editor, and reviewer
            sessions.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {access.permissions.map((permission) => (
              <span
                key={permission}
                className="rounded-md border border-border bg-surface-muted px-3 py-2 text-xs font-semibold"
              >
                {permission}
              </span>
            ))}
          </div>
        </Card>

        <AdminTableShell
          title="Data management roadmap"
          description="Structured placeholders for the first operational workflows."
          createLabel="Create placeholder"
          rows={[
            {
              label: "Create event",
              detail:
                "Future event creation with country, season, stage, and source links.",
              status: "placeholder",
            },
            {
              label: "Review imported result",
              detail: "Approve automation changes before they reach public pages.",
              status: "review",
            },
            {
              label: "Inspect source link",
              detail: "Trace public records back to official timing PDFs and sources.",
              status: "placeholder",
            },
          ]}
        />
      </section>
    </div>
  );
}
