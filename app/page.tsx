import Link from "next/link";
import { Activity, Bike, CalendarDays, Gauge, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { StatCard } from "@/components/stat-card";
import { getHomeSummary } from "@/db/events";
import { formatDateRange, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const summary = await getHomeSummary();

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <SiteHeader />

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-16">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-accent">
            Live from the database
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Hard Enduro data, timing, riders, and motorcycles in one structured
            championship platform.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground/72">
            This first vertical slice proves the database connection, seeded event data,
            public routing, and stage timing table end-to-end.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/events"
              className="rounded-md bg-foreground px-5 py-3 text-sm font-semibold text-surface transition hover:opacity-88"
            >
              View events
            </Link>
            {summary.latestEvents[0] ? (
              <Link
                href={`/events/${summary.latestEvents[0].slug}`}
                className="rounded-md border border-border px-5 py-3 text-sm font-semibold transition hover:border-accent"
              >
                Open seeded event
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Events"
            value={formatNumber(summary.eventCount)}
            icon={CalendarDays}
          />
          <StatCard
            label="Riders"
            value={formatNumber(summary.riderCount)}
            icon={Users}
          />
          <StatCard
            label="Motorcycles"
            value={formatNumber(summary.motorcycleCount)}
            icon={Bike}
          />
          <StatCard
            label="Stage timing rows"
            value={formatNumber(summary.stageResultCount)}
            icon={Gauge}
          />
        </div>
      </section>

      <section className="border-t border-border bg-surface-muted">
        <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                Seeded events
              </p>
              <h2 className="mt-2 text-2xl font-semibold">First public data</h2>
            </div>
            <Activity className="h-5 w-5 text-accent" aria-hidden="true" />
          </div>

          <div className="grid gap-3">
            {summary.latestEvents.map((event) => {
              const topStageResult = event.stages[0]?.stageResults[0];

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="rounded-md border border-border bg-surface p-5 transition hover:border-accent"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-foreground/64">
                        {event.season.year}
                        {event.country ? ` • ${event.country.name}` : ""}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold">{event.name}</h3>
                      <p className="mt-2 text-sm text-foreground/64">
                        {formatDateRange(event.startDate, event.endDate)}
                      </p>
                    </div>
                    <div className="rounded-md bg-surface-muted px-4 py-3 text-sm">
                      <span className="text-foreground/60">Stage leader</span>
                      <p className="mt-1 font-semibold">
                        {topStageResult
                          ? `${topStageResult.rider.firstName} ${topStageResult.rider.lastName}`
                          : "Pending"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
