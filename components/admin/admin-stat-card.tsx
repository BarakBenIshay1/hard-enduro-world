import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type AdminStatCardProps = {
  label: string;
  value: number | string;
  detail: string;
  icon: LucideIcon;
};

export function AdminStatCard({ label, value, detail, icon: Icon }: AdminStatCardProps) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
      <p className="mt-6 text-xs uppercase tracking-[0.16em] text-foreground/[0.48]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-2 text-sm text-foreground/[0.58]">{detail}</p>
    </Card>
  );
}
