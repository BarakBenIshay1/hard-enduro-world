import type { Metadata } from "next";
import { ChangeDiffCard } from "@/components/admin/change-diff-card";
import { ImportStatusBadge } from "@/components/admin/import-status-badge";
import {
  adminTableCardClass,
  adminTableCellClass,
  adminTableHeadClass,
  adminTableHeaderCellClass,
  adminTableMutedCellClass,
  adminTablePrimaryCellClass,
  adminTableScrollClass,
  adminWideTableClass,
} from "@/components/admin/admin-table-styles";
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
    <div className="grid min-w-0 gap-8">
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

      <Card className={adminTableCardClass}>
        <div className={adminTableScrollClass}>
          <table className={adminWideTableClass}>
            <thead className={adminTableHeadClass}>
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
                  <th key={heading} className={adminTableHeaderCellClass}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr key={version.id} className="border-t border-border">
                  <td className={adminTablePrimaryCellClass}>
                    <span className="font-semibold">{version.entityType}</span>
                  </td>
                  <td className={`${adminTableCellClass} font-mono text-xs`}>
                    {version.entityId}
                  </td>
                  <td className={adminTableCellClass}>{version.action}</td>
                  <td className={adminTableCellClass}>
                    <pre className="max-h-24 overflow-auto rounded-md bg-surface-muted p-3 text-xs">
                      {JSON.stringify(version.previous ?? {}, null, 2)}
                    </pre>
                  </td>
                  <td className={adminTableCellClass}>
                    <pre className="max-h-24 overflow-auto rounded-md bg-surface-muted p-3 text-xs">
                      {JSON.stringify(version.next ?? {}, null, 2)}
                    </pre>
                  </td>
                  <td className={adminTableMutedCellClass}>
                    {formatOptional(version.sourceUrl)}
                  </td>
                  <td className={adminTableCellClass}>{version.createdBy ?? "system"}</td>
                  <td className={adminTableCellClass}>{formatDate(version.createdAt)}</td>
                  <td className={adminTableCellClass}>
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
