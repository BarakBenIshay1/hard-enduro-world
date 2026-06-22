import { Card } from "@/components/ui/card";

type ChangeDiffCardProps = {
  title: string;
  previous: unknown;
  next: unknown;
};

export function ChangeDiffCard({ title, previous, next }: ChangeDiffCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-5">
        <h3 className="text-lg font-black">{title}</h3>
      </div>
      <div className="grid gap-0 md:grid-cols-2">
        <DiffPane label="Previous" value={previous} />
        <DiffPane label="New" value={next} />
      </div>
    </Card>
  );
}

function DiffPane({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="border-t border-border p-5 md:border-l md:border-t-0 md:first:border-l-0">
      <p className="text-xs uppercase tracking-[0.18em] text-foreground/[0.48]">
        {label}
      </p>
      <pre className="mt-3 max-h-64 overflow-auto rounded-md border border-border bg-surface-muted p-4 text-xs leading-6">
        {JSON.stringify(value ?? {}, null, 2)}
      </pre>
    </div>
  );
}
