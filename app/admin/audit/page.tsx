import type { Metadata } from "next";
import { ChangeDiffCard } from "@/components/admin/change-diff-card";
import { ImportStatusBadge } from "@/components/admin/import-status-badge";
import { Card } from "@/components/ui/card";
import { getAuditLogData } from "@/db/audit";
import { formatDate, formatOptional } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Audit Log",
  description: "Admin audit log foundation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminAuditPage() {
  const { versions } = await getAuditLogData();
  const latest = versions[0];

  return (
    <div className="grid gap-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Audit Log
        </p>
        <h1 className="mt-2 text-3xl font-black lg:text-5xl">Change history</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Inspect entity changes, source URLs, previous values, new values, changed-by
          context, and import status.
        </p>
      </section>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
              <tr>
                {[
                  "Entity type",
                  "Entity name / ID",
                  "Action",
                  "Previous value",
                  "New value",
                  "Source URL",
                  "Changed by",
                  "Changed at",
                  "Status",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-4 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr key={version.id} className="border-t border-border">
                  <td className="px-5 py-4 font-semibold">{version.entityType}</td>
                  <td className="px-5 py-4 font-mono text-xs">{version.entityId}</td>
                  <td className="px-5 py-4">{version.action}</td>
                  <td className="px-5 py-4">
                    <pre className="max-h-24 overflow-auto rounded-md bg-surface-muted p-3 text-xs">
                      {JSON.stringify(version.previous ?? {}, null, 2)}
                    </pre>
                  </td>
                  <td className="px-5 py-4">
                    <pre className="max-h-24 overflow-auto rounded-md bg-surface-muted p-3 text-xs">
                      {JSON.stringify(version.next ?? {}, null, 2)}
                    </pre>
                  </td>
                  <td className="px-5 py-4 text-foreground/[0.62]">
                    {formatOptional(version.sourceUrl)}
                  </td>
                  <td className="px-5 py-4">{version.createdBy ?? "system"}</td>
                  <td className="px-5 py-4">{formatDate(version.createdAt)}</td>
                  <td className="px-5 py-4">
                    <ImportStatusBadge
                      status={version.importRun?.status ?? "COMPLETED"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ChangeDiffCard
        title="Latest change diff"
        previous={latest?.previous}
        next={latest?.next}
      />
    </div>
  );
}
