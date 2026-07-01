import { Edit3, Eye } from "lucide-react";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Card } from "@/components/ui/card";

type AdminTableShellProps = {
  title: string;
  description: string;
  createLabel: string;
  rows: Array<{
    label: string;
    detail: string;
    status?: "ready" | "placeholder" | "locked" | "review";
  }>;
};

export function AdminTableShell({
  title,
  description,
  createLabel,
  rows,
}: AdminTableShellProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">{description}</p>
        </div>
        <AdminActionButton disabled>{createLabel}</AdminActionButton>
      </div>
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
              <tr>
                <th className="px-5 py-4">Item</th>
                <th className="px-5 py-4">Purpose</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <td className="px-5 py-4 font-semibold">{row.label}</td>
                  <td className="px-5 py-4 text-foreground/[0.62]">{row.detail}</td>
                  <td className="px-5 py-4">
                    <AdminStatusBadge status={row.status ?? "placeholder"} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface-muted px-3 text-xs font-semibold opacity-70"
                      >
                        <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface-muted px-3 text-xs font-semibold opacity-70"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-5">
          <AdminEmptyState
            title="No rows yet"
            description="CRUD and imported-data review will be connected in a later release."
          />
        </div>
      )}
    </Card>
  );
}
