import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VersionTimeline } from "@/components/admin/version-timeline";
import { Card } from "@/components/ui/card";
import { getAdminStandingDetail } from "@/db/admin-standings";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const standing = await getAdminStandingDetail(id);
  return {
    title: standing
      ? `${standing.rider.firstName} ${standing.rider.lastName} standing`
      : "Standing",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminStandingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const standing = await getAdminStandingDetail(id);
  if (!standing) notFound();

  const riderName = `${standing.rider.firstName} ${standing.rider.lastName}`;

  return (
    <div className="grid min-w-0 gap-6">
      <section>
        <Link
          href="/admin/standings"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
        >
          Back to standings
        </Link>
        <h1 className="mt-3 text-3xl font-black lg:text-5xl">{riderName}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Published standing row. Changes are made through Calculation → Review → Approve
          → Explicit Apply.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-5">
          <h2 className="text-xl font-black">Standing</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Meta label="Season" value={standing.season.name} />
            <Meta label="Position" value={standing.position ?? "Unranked"} />
            <Meta label="Points" value={standing.points} />
            <Meta label="Wins" value={standing.wins} />
            <Meta label="Podiums" value={standing.podiums} />
            <Meta label="Starts" value={standing.starts} />
            <Meta label="DNFs" value={standing.dnfs} />
            <Meta label="Class" value={standing.className ?? "Overall"} />
            <Meta label="Updated" value={formatDate(standing.updatedAt)} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-black">Stored information</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <Meta label="Standing ID" value={standing.id} mono />
            <Meta label="Season ID" value={standing.seasonId} mono />
            <Meta label="Rider ID" value={standing.riderId} mono />
            <Meta label="Created" value={formatDate(standing.createdAt)} />
            <Meta label="Review Items" value={standing.reviewItems.length} />
            <Meta label="Versions" value={standing.versions.length} />
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-xl font-black">Related review items</h2>
        <div className="mt-5 grid gap-3">
          {standing.reviewItems.length ? (
            standing.reviewItems.map((item) => (
              <Link
                key={item.id}
                href={`/admin/review/${item.id}`}
                className="rounded-md border border-border bg-surface-muted p-4 text-sm transition hover:border-accent"
              >
                <span className="font-semibold">{item.suggestedAction}</span>
                <span className="ml-2 text-foreground/[0.58]">
                  {item.reviewStatus} / {item.applicationStatus}
                </span>
                <span className="mt-1 block text-xs text-foreground/[0.48]">
                  Snapshot {item.snapshot.id} · {formatDate(item.snapshot.createdAt)}
                </span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-foreground/[0.58]">
              No calculation review item is linked to this standing yet.
            </p>
          )}
        </div>
      </Card>

      <VersionTimeline
        items={standing.versions.map((version) => ({
          id: version.id,
          title: version.action,
          description: version.actor
            ? `Changed by ${version.actor.displayName ?? version.actor.email ?? "admin"}`
            : "System change",
          action: version.action,
          createdAt: version.createdAt,
        }))}
      />
    </div>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-xs uppercase tracking-[0.14em] text-foreground/[0.45]">
        {label}
      </span>
      <span
        className={mono ? "break-all font-mono text-xs" : "break-words font-semibold"}
      >
        {value}
      </span>
    </div>
  );
}
