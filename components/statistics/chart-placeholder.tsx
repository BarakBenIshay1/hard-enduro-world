import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";

type ChartPlaceholderProps = {
  title: string;
  description: string;
  bars: Array<{
    label: string;
    value: number;
  }>;
};

export function ChartPlaceholder({ title, description, bars }: ChartPlaceholderProps) {
  const maxValue = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Chart-ready</p>
          <h3 className="mt-2 text-2xl font-black">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">{description}</p>
        </div>
        <BarChart3 className="h-6 w-6 text-accent" aria-hidden="true" />
      </div>
      <div className="mt-8 grid gap-4">
        {bars.slice(0, 6).map((bar) => (
          <div key={bar.label} className="grid gap-2">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold">{bar.label}</span>
              <span className="font-mono text-accent">{bar.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-gold"
                style={{ width: `${Math.max(6, (bar.value / maxValue) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
