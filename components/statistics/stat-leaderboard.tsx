import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export type LeaderboardRow = {
  id: string;
  label: string;
  value: number | string;
  href?: string;
  detail?: string;
};

type StatLeaderboardProps = {
  title: string;
  description?: string;
  rows: LeaderboardRow[];
};

export function StatLeaderboard({ title, description, rows }: StatLeaderboardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-5">
        <h3 className="text-xl font-black">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">{description}</p>
        ) : null}
      </div>
      <div className="divide-y divide-border">
        {rows.slice(0, 8).map((row, index) => (
          <div
            key={row.id}
            className="grid grid-cols-[44px_1fr_auto] items-center gap-4 p-4"
          >
            <span className="font-mono text-sm text-foreground/[0.48]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              {row.href ? (
                <Link
                  href={row.href}
                  className="inline-flex items-center gap-2 font-semibold transition hover:text-accent"
                >
                  {row.label}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              ) : (
                <p className="font-semibold">{row.label}</p>
              )}
              {row.detail ? (
                <p className="mt-1 text-xs text-foreground/[0.52]">{row.detail}</p>
              ) : null}
            </div>
            <span className="font-mono text-lg font-black text-accent">{row.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
