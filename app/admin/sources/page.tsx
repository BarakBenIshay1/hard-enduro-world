import type { Metadata } from "next";
import Link from "next/link";
import { Database, ExternalLink } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { ConfidenceBadge } from "@/components/admin/confidence-badge";
import { SourceBadge } from "@/components/admin/source-badge";
import { Card } from "@/components/ui/card";
import { getSourcesAdminData } from "@/db/sources";
import { formatDate, formatOptional } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sources",
  description: "Admin source tracking foundation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminSourcesPage() {
  const { sources } = await getSourcesAdminData();

  return (
    <div className="grid gap-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Source Tracking
        </p>
        <h1 className="mt-2 text-3xl font-black lg:text-5xl">Sources</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Track official sources, reliability, linked entities, snapshots, import runs,
          and future confidence scoring before automated updates reach public data.
        </p>
      </section>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-black">Sources overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-black text-xs uppercase tracking-[0.18em] text-white/[0.64]">
              <tr>
                {[
                  "Source",
                  "Type",
                  "URL",
                  "Reliability",
                  "Last fetched",
                  "Verified",
                  "Confidence",
                  "Status",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-4 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => {
                const latestSnapshot = source.snapshots[0];
                const latestRun = latestSnapshot?.importRuns[0];
                const confidence = source.reliability === "OFFICIAL" ? 96 : 82;

                return (
                  <tr key={source.id} className="border-t border-border">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/sources/${source.id}`}
                        className="inline-flex items-center gap-2 font-semibold hover:text-accent"
                      >
                        <Database className="h-4 w-4 text-accent" aria-hidden="true" />
                        {source.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4">{source.type}</td>
                    <td className="px-5 py-4">
                      {source.baseUrl ? (
                        <a
                          href={source.baseUrl}
                          className="inline-flex items-center gap-2 text-foreground/[0.64] hover:text-accent"
                        >
                          {source.baseUrl}
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      ) : (
                        "Manual"
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <SourceBadge reliability={source.reliability} />
                    </td>
                    <td className="px-5 py-4">
                      {latestSnapshot ? formatDate(latestSnapshot.fetchedAt) : "Pending"}
                    </td>
                    <td className="px-5 py-4">
                      {source.reliability === "OFFICIAL" ? "Yes" : "Review"}
                    </td>
                    <td className="px-5 py-4">
                      <ConfidenceBadge score={confidence} />
                    </td>
                    <td className="px-5 py-4">
                      <AdminStatusBadge
                        status={latestRun?.status === "FAILED" ? "review" : "ready"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-foreground/[0.48]">
          Future automation flow
        </p>
        <p className="mt-3 text-sm leading-6 text-foreground/[0.64]">
          Official source {"->"} snapshot {"->"} parser {"->"} diff {"->"} review {"->"}{" "}
          approval {"->"} data update {"->"} audit log.
        </p>
        <p className="mt-3 text-xs text-foreground/[0.48]">
          Linked entities:{" "}
          {formatOptional(sources.reduce((sum, source) => sum + source.links.length, 0))}
        </p>
      </Card>
    </div>
  );
}
