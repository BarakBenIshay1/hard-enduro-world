import Link from "next/link";
import { Card } from "@/components/ui/card";

type MiniRankingTableProps = {
  title: string;
  rows: Array<{
    id: string;
    label: string;
    value: number;
    href?: string;
    detail?: string;
  }>;
};

export function MiniRankingTable({ title, rows }: MiniRankingTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-5">
        <h3 className="text-lg font-black">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
            <tr>
              <th className="px-5 py-4">Rank</th>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((row, index) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-5 py-4 font-mono">{index + 1}</td>
                <td className="px-5 py-4">
                  {row.href ? (
                    <Link href={row.href} className="font-semibold hover:text-accent">
                      {row.label}
                    </Link>
                  ) : (
                    <span className="font-semibold">{row.label}</span>
                  )}
                  {row.detail ? (
                    <p className="mt-1 text-xs text-foreground/[0.52]">{row.detail}</p>
                  ) : null}
                </td>
                <td className="px-5 py-4 font-mono text-accent">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
