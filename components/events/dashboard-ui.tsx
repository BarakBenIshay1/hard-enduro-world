import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getOfficialSource } from "@/data/verified/source-registry";
import type { VerifiedEventFact, VerifiedSourcedLink } from "@/data/verified/types";
import { cn } from "@/lib/cn";
import { formatOptional } from "@/lib/format";
import { UNKNOWN_VERIFIED_VALUE } from "./helpers";
import type { CrossLink, EventResult } from "./types";

export function DetailRow({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface-muted",
        compact ? "p-2" : "p-3",
      )}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-foreground/[0.46]">
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  fallback = "TBC",
}: {
  label: string;
  value: string | number | null | undefined;
  fallback?: string;
}) {
  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/[0.46]">
        {label}
      </p>
      {hasValue ? (
        <p className="mt-2 text-xl font-black">{String(value)}</p>
      ) : (
        <CompactUnknown label={fallback} />
      )}
    </Card>
  );
}

export function CompactUnknown({ label }: { label: string }) {
  return (
    <span className="mt-2 inline-flex w-fit rounded-sm border border-dashed border-border bg-surface-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/[0.52]">
      {label}
    </span>
  );
}

export function CompactMessage({ text }: { text: string }) {
  return (
    <span className="inline-flex w-fit rounded-sm border border-border bg-surface-muted px-3 py-2 text-xs font-semibold text-foreground/[0.62]">
      {text}
    </span>
  );
}

export function CompactMetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
      <span className="text-foreground/[0.56]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export function ResourceRow({
  label,
  meta,
  href,
}: {
  label: string;
  meta: string;
  href: string | null;
}) {
  const content = (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm transition hover:border-accent">
      <span className="font-semibold">{label}</span>
      <span className="shrink-0 rounded-sm border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/[0.52]">
        {meta}
      </span>
    </div>
  );

  return href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    content
  );
}

export function CompactTextBlock({
  title,
  text,
}: {
  title: string;
  text?: string | null;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-muted p-4">
      <h3 className="font-black">{title}</h3>
      {text ? (
        <p className="mt-2 text-sm leading-6 text-foreground/[0.64]">{text}</p>
      ) : (
        <CompactUnknown label="TBC" />
      )}
    </div>
  );
}

export function DashboardPanel({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-32 p-4">
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export function CrossLinkGroup({ title, links }: { title: string; links: CrossLink[] }) {
  return (
    <Card className="p-5">
      <h3 className="text-lg font-black">{title}</h3>
      <div className="mt-4 grid gap-2">
        {links.length > 0 ? (
          links.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="rounded-md border border-border bg-surface-muted p-3 transition hover:border-accent hover:text-accent"
            >
              <span className="block text-sm font-semibold">{link.label}</span>
              <span className="mt-1 block text-xs text-foreground/[0.54]">
                {link.detail}
              </span>
            </Link>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-border bg-surface-muted p-3 text-sm text-foreground/[0.58]">
            {UNKNOWN_VERIFIED_VALUE}
          </div>
        )}
      </div>
    </Card>
  );
}

export function CompactTimelineItem({
  item,
}: {
  item: NonNullable<VerifiedEventFact["eventTimeline"]>[number];
}) {
  return (
    <div className="rounded-md border border-border bg-surface-muted p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-black">{item.label}</h4>
          {item.description ? (
            <p className="mt-1 text-sm text-foreground/[0.58]">{item.description}</p>
          ) : null}
        </div>
        <Badge>TBC</Badge>
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        {item.date ?? "Date TBC"}
      </p>
    </div>
  );
}

export function SourceTrail({ sourceIds }: { sourceIds?: string[] }) {
  const labels =
    sourceIds?.map((sourceId) => getOfficialSource(sourceId)?.name ?? sourceId) ?? [];

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {labels.length > 0 ? (
        labels.map((label) => (
          <span
            key={label}
            className="rounded-sm border border-border bg-surface-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/[0.54]"
          >
            Source: {label}
          </span>
        ))
      ) : (
        <span className="rounded-sm border border-border bg-surface-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/[0.54]">
          Source: {UNKNOWN_VERIFIED_VALUE}
        </span>
      )}
    </div>
  );
}

export function OfficialPlaceholderCard({
  icon: Icon,
  title,
  link,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  title: string;
  link: VerifiedSourcedLink;
}) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
      <h3 className="mt-5 text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
        {link.url ?? UNKNOWN_VERIFIED_VALUE}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">{link.notes}</p>
      <SourceTrail sourceIds={link.sourceIds} />
    </Card>
  );
}

export function OverallResultsTable({ results }: { results: EventResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-left text-sm">
        <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.18em] text-white/[0.62]">
          <tr>
            {[
              "Pos",
              "Rider",
              "Country",
              "Team",
              "Manufacturer",
              "Bike",
              "Time",
              "Gap",
              "Penalty",
              "Points",
              "Status",
            ].map((heading) => (
              <th key={heading} className="px-4 py-3 font-semibold">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const podium = result.overallPosition !== null && result.overallPosition <= 3;

            return (
              <tr
                key={result.id}
                className={cn("border-t border-white/10", podium && "bg-accent/10")}
              >
                <td className="px-4 py-4 text-lg font-black text-accent">
                  {formatOptional(result.overallPosition)}
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/riders/${result.rider.slug}`}
                    className="font-semibold transition hover:text-accent"
                  >
                    {`${result.rider.firstName} ${result.rider.lastName}`}
                  </Link>
                </td>
                <td className="px-4 py-4">{result.rider.country?.isoCode ?? "TBC"}</td>
                <td className="px-4 py-4 text-white/[0.66]">
                  {result.rider.teamMemberships[0]?.team.name ?? "Independent"}
                </td>
                <td className="px-4 py-4">
                  {result.manufacturer?.name ??
                    result.motorcycle?.manufacturer.name ??
                    "TBC"}
                </td>
                <td className="px-4 py-4 text-white/[0.66]">
                  {result.motorcycle
                    ? `${result.motorcycle.manufacturer.name} ${result.motorcycle.model}`
                    : "TBC"}
                </td>
                <td className="px-4 py-4 font-mono">
                  {formatOptional(result.totalTimeText)}
                </td>
                <td className="px-4 py-4 font-mono">
                  {formatOptional(result.gapToLeaderText)}
                </td>
                <td className="px-4 py-4 font-mono">
                  {formatOptional(
                    result.penaltiesMs
                      ? `${Math.round(result.penaltiesMs / 1000)}s`
                      : null,
                  )}
                </td>
                <td className="px-4 py-4 font-black">{formatOptional(result.points)}</td>
                <td className="px-4 py-4">
                  <span className="rounded-sm border border-white/12 bg-white/10 px-2 py-1 text-xs font-semibold">
                    {result.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function SummaryTable({
  headings,
  rows,
}: {
  headings: string[];
  rows: string[][];
}) {
  return (
    <Card className="mt-8 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
            <tr>
              {headings.map((heading) => (
                <th key={heading} className="px-4 py-3 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")} className="border-t border-border">
                {row.map((cell) => (
                  <td key={cell} className="px-4 py-4">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
