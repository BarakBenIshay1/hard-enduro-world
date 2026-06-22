import { ImportStatusBadge } from "@/components/admin/import-status-badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export type VersionTimelineItem = {
  id: string;
  title: string;
  description: string;
  action: string;
  status?: string;
  createdAt: Date;
};

type VersionTimelineProps = {
  items: VersionTimelineItem[];
};

export function VersionTimeline({ items }: VersionTimelineProps) {
  return (
    <Card className="p-5">
      <h3 className="text-xl font-black">Version timeline</h3>
      <div className="mt-6 grid gap-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 rounded-md border border-border bg-surface-muted p-4 md:grid-cols-[140px_1fr_auto]"
            >
              <p className="font-mono text-sm text-foreground/[0.58]">
                {formatDate(item.createdAt)}
              </p>
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-foreground/[0.58]">{item.description}</p>
              </div>
              <ImportStatusBadge status={item.status ?? item.action} />
            </div>
          ))
        ) : (
          <p className="text-sm text-foreground/[0.58]">
            No version entries yet. Future imports and manual edits will appear here.
          </p>
        )}
      </div>
    </Card>
  );
}
