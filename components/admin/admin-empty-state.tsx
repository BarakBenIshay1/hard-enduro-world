import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";

type AdminEmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function AdminEmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: AdminEmptyStateProps) {
  return (
    <Card className="p-8 text-center">
      <Icon className="mx-auto h-8 w-8 text-accent" aria-hidden="true" />
      <h2 className="mt-5 text-xl font-black">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-foreground/[0.62]">
        {description}
      </p>
    </Card>
  );
}
