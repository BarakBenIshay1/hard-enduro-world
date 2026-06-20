import type { LucideIcon } from "lucide-react";
import { CircleOff } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function EmptyState({
  title,
  description,
  icon: Icon = CircleOff,
}: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-border bg-surface-muted p-8 text-center">
      <Icon className="mx-auto h-6 w-6 text-accent" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground/64">
        {description}
      </p>
    </div>
  );
}
