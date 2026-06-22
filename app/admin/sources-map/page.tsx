import type { Metadata } from "next";
import {
  AlertTriangle,
  Database,
  FileCheck2,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";
import { getSourceMapAdminData } from "@/db/source-map";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Source Map",
  description: "Source of truth and source mapping foundation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminSourceMapPage() {
  const data = await getSourceMapAdminData();

  return (
    <div className="grid gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Source Map
          </p>
          <h1 className="mt-2 text-3xl font-black lg:text-5xl">
            Source of truth foundation
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
            Central rules for where each data type should come from, what can be
            automated, what must be reviewed, and what should only be derived from
            approved source data.
          </p>
        </div>
        <AdminStatusBadge status="review" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          label="Data Types"
          value={data.summary.totalDataTypes}
          detail="Mapped source categories"
          icon={Database}
        />
        <AdminStatCard
          label="High Risk"
          value={data.summary.highRiskCount}
          detail="Always review"
          icon={AlertTriangle}
        />
        <AdminStatCard
          label="Review Required"
          value={data.summary.reviewRequiredCount}
          detail="Before public changes"
          icon={ShieldCheck}
        />
        <AdminStatCard
          label="Connectors"
          value={data.summary.automatedCount}
          detail="Foundation ready"
          icon={MapPinned}
        />
        <AdminStatCard
          label="Derived"
          value={data.summary.derivedCount}
          detail="Calculation preview"
          icon={FileCheck2}
        />
      </section>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Source map</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
            This table defines primary and secondary sources before real integrations
            begin.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1360px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
              <tr>
                {[
                  "Data type",
                  "Primary source",
                  "Secondary source",
                  "Current connector",
                  "Frequency",
                  "Risk",
                  "Review",
                  "Automation",
                  "Notes",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-4 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.dataType} className="border-t border-border">
                  <td className="px-5 py-4 font-semibold">{item.dataType}</td>
                  <td className="px-5 py-4">{item.primarySource}</td>
                  <td className="px-5 py-4">{item.secondarySource}</td>
                  <td className="px-5 py-4">{item.currentConnector}</td>
                  <td className="px-5 py-4">{item.importFrequency}</td>
                  <td className="px-5 py-4">{item.riskLevel}</td>
                  <td className="px-5 py-4">{item.reviewRequired ? "Yes" : "No"}</td>
                  <td className="px-5 py-4">{item.automationStatus}</td>
                  <td className="px-5 py-4 text-foreground/[0.62]">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-black">Source of truth rules</h2>
          <div className="mt-5 grid gap-3">
            {data.sourceTruthRules.map((rule) => (
              <div
                key={rule.dataType}
                className="rounded-md border border-border bg-surface-muted p-4"
              >
                <p className="font-semibold">{rule.dataType}</p>
                <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
                  {rule.rule}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-accent">
                  Automate: {rule.canAutomate ? "Yes" : "No"} / Review:{" "}
                  {rule.mustReview ? "Yes" : "No"} / Direct import blocked:{" "}
                  {rule.neverDirectlyImport ? "Yes" : "No"}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black">Conflict rules</h2>
          <div className="mt-5 grid gap-3">
            {data.conflictRules.map((rule) => (
              <div
                key={rule.title}
                className="rounded-md border border-border bg-surface-muted p-4"
              >
                <p className="font-semibold">{rule.title}</p>
                <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
                  {rule.description}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-accent">
                  {rule.appliesTo}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
