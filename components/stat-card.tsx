import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-md border border-border bg-surface-muted p-5">
      <Icon className="mb-5 h-5 w-5 text-accent" aria-hidden="true" />
      <p className="text-sm text-foreground/64">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
