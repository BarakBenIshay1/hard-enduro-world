import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTableShell } from "@/components/admin/admin-table-shell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type AdminSectionPageProps = {
  params: Promise<{
    section: string;
  }>;
};

type SectionConfig = {
  title: string;
  description: string;
  createLabel: string;
  status: "ready" | "placeholder" | "locked" | "review";
  rows: Array<{
    label: string;
    detail: string;
    status?: "ready" | "placeholder" | "locked" | "review";
  }>;
};

const sectionConfigs: Record<string, SectionConfig> = {
  events: {
    title: "Events",
    description:
      "Prepare future event creation, editing, stage setup, and official source links.",
    createLabel: "Create event",
    status: "placeholder",
    rows: [
      {
        label: "Create event",
        detail:
          "Add season, country, venue, dates, status, stages, documents, and source links.",
      },
      {
        label: "Edit event",
        detail: "Update event metadata without touching code or seed files.",
      },
      {
        label: "Audit event history",
        detail: "Future audit trail for every imported or manual event change.",
        status: "locked",
      },
    ],
  },
  riders: {
    title: "Riders",
    description:
      "Prepare rider profile creation, career history editing, and media attribution.",
    createLabel: "Add rider",
    status: "placeholder",
    rows: [
      {
        label: "Add rider",
        detail:
          "Create rider profiles with country, motorcycle, team, biography, and links.",
      },
      {
        label: "Edit rider",
        detail: "Update rider career records and current motorcycle assignments.",
      },
      {
        label: "Review rider updates",
        detail: "Approve imported profile changes from official sources.",
        status: "review",
      },
    ],
  },
  teams: {
    title: "Teams",
    description:
      "Prepare team management, manufacturer relationships, and rider memberships.",
    createLabel: "Create team",
    status: "placeholder",
    rows: [
      {
        label: "Create team",
        detail: "Add team identity, country, manufacturer affiliation, and history.",
      },
      {
        label: "Edit memberships",
        detail: "Manage rider-to-team relationships by season.",
      },
    ],
  },
  manufacturers: {
    title: "Manufacturers",
    description:
      "Prepare manufacturer profiles, country links, and future statistics approval.",
    createLabel: "Create manufacturer",
    status: "placeholder",
    rows: [
      {
        label: "Create manufacturer",
        detail: "Add factory brand identity, country, and public profile metadata.",
      },
      {
        label: "Review calculated stats",
        detail: "Approve automated manufacturer statistics after imports.",
        status: "review",
      },
    ],
  },
  motorcycles: {
    title: "Motorcycles",
    description:
      "Prepare motorcycle specs, rider usage, setup data, and performance history.",
    createLabel: "Create motorcycle",
    status: "placeholder",
    rows: [
      {
        label: "Create motorcycle",
        detail:
          "Add model, year, engine, stroke, suspension, power, fuel, and description.",
      },
      {
        label: "Edit technical specs",
        detail: "Manage structured motorcycle data for future setup guides.",
      },
    ],
  },
  results: {
    title: "Results",
    description:
      "Prepare final classification updates, timing rows, penalties, and approvals.",
    createLabel: "Update result",
    status: "review",
    rows: [
      {
        label: "Update result",
        detail: "Edit final positions, status, points, time, gaps, and penalties.",
      },
      {
        label: "Review imported timing",
        detail: "Approve automation changes before public results update.",
        status: "review",
      },
      {
        label: "Inspect official raw row",
        detail: "Compare parsed data to official timing table source rows.",
      },
    ],
  },
  standings: {
    title: "Standings",
    description:
      "Prepare standings review, recalculation, and manual correction workflows.",
    createLabel: "Recalculate standings",
    status: "placeholder",
    rows: [
      {
        label: "Update standings",
        detail: "Review position, points, wins, podiums, starts, and DNFs.",
      },
      {
        label: "Approve recalculation",
        detail: "Future automated standings jobs will land here for approval.",
        status: "review",
      },
    ],
  },
  sources: {
    title: "Sources",
    description:
      "Prepare official source tracking, source snapshots, and imported data lineage.",
    createLabel: "Add source",
    status: "placeholder",
    rows: [
      {
        label: "Add source link",
        detail:
          "Connect records to official PDFs, timing pages, federation pages, and media.",
      },
      {
        label: "Inspect source snapshot",
        detail: "Review raw imported content, hashes, status codes, and parsing output.",
      },
      {
        label: "View audit history",
        detail: "Trace every update back to source and version records.",
        status: "locked",
      },
    ],
  },
  review: {
    title: "Review Queue",
    description:
      "Prepare import approvals, conflict review, and automation change control.",
    createLabel: "Review item",
    status: "review",
    rows: [
      {
        label: "Approve automation change",
        detail: "Future imports will require review before public publication.",
        status: "review",
      },
      {
        label: "Resolve data conflict",
        detail: "Compare existing record values against newly imported source data.",
        status: "review",
      },
    ],
  },
  settings: {
    title: "Settings",
    description:
      "Prepare Supabase Auth, roles, permissions, environment checks, and audit settings.",
    createLabel: "Create role",
    status: "locked",
    rows: [
      {
        label: "Owner role",
        detail: "Full platform access and future role management.",
        status: "locked",
      },
      {
        label: "Admin role",
        detail: "Manage content, imports, and sources.",
        status: "locked",
      },
      {
        label: "Editor role",
        detail: "Create and edit content records.",
        status: "locked",
      },
      {
        label: "Reviewer role",
        detail: "Review imports and inspect source data.",
        status: "locked",
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: AdminSectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const config = sectionConfigs[section];

  if (!config) {
    return {
      title: "Admin",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: config.title,
    description: config.description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default async function AdminSectionPage({ params }: AdminSectionPageProps) {
  const { section } = await params;
  const config = sectionConfigs[section];

  if (!config) {
    notFound();
  }

  return (
    <div className="grid gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Admin Section
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">{config.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            {config.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminStatusBadge status={config.status} />
          <AdminActionButton disabled>{config.createLabel}</AdminActionButton>
        </div>
      </section>

      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-foreground/[0.48]">
          Data Management Concept
        </p>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-foreground/[0.64]">
          This page is a structured placeholder. Future approved steps can connect
          Supabase Auth, CRUD forms, source-link inspection, imported-data review, audit
          history, and role-based permissions without changing the public page modules.
        </p>
      </Card>

      <AdminTableShell
        title={`${config.title} table placeholder`}
        description="Table layout, create action, edit action, and review action are ready for future CRUD wiring."
        createLabel={config.createLabel}
        rows={config.rows}
      />
    </div>
  );
}
