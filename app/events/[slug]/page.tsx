import Link from "next/link";
import { CalendarDays, CloudSun, FileClock, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { StageTimingTable } from "@/components/stage-timing-table";
import { getEventDetail } from "@/db/events";
import { formatDateRange, formatOptional } from "@/lib/format";

export const dynamic = "force-dynamic";

type EventDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventDetail(slug);

  return {
    title: event.name,
    description: event.description ?? `${event.name} event detail and stage timing.`,
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventDetail(slug);
  const firstStage = event.stages[0];
  const latestWeather = event.weatherSnapshots[0];

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
        <Link
          href="/events"
          className="text-sm font-semibold text-accent transition hover:text-foreground"
        >
          Back to events
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              Round {event.roundNumber ?? "TBC"} • {event.season.year}
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
              {event.name}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-foreground/72">
              {event.description}
            </p>
          </div>

          <aside className="rounded-md border border-border bg-surface-muted p-5">
            <h2 className="text-base font-semibold">Event snapshot</h2>
            <dl className="mt-5 grid gap-4 text-sm">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
                <div>
                  <dt className="text-foreground/56">Dates</dt>
                  <dd className="mt-1 font-medium">
                    {formatDateRange(event.startDate, event.endDate)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
                <div>
                  <dt className="text-foreground/56">Location</dt>
                  <dd className="mt-1 font-medium">
                    {[event.venue, event.city, event.country?.name]
                      .filter(Boolean)
                      .join(", ")}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileClock className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
                <div>
                  <dt className="text-foreground/56">Status</dt>
                  <dd className="mt-1 font-medium">{event.liveStatus}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CloudSun className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
                <div>
                  <dt className="text-foreground/56">Weather</dt>
                  <dd className="mt-1 font-medium">
                    {latestWeather
                      ? `${formatOptional(latestWeather.temperatureC?.toString())} C, ${latestWeather.weatherDescription}`
                      : "Pending"}
                  </dd>
                </div>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="border-y border-border bg-surface-muted">
        <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                Event timeline
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Lifecycle</h2>
            </div>
            <p className="text-sm text-foreground/64">
              {event.timelineItems.length} timeline item
              {event.timelineItems.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="grid gap-3">
            {event.timelineItems.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-border bg-surface p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground/52">
                  {item.type.replaceAll("_", " ")}
                </p>
                <h3 className="mt-1 font-semibold">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            Stage timing
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {firstStage ? firstStage.name : "No stage results yet"}
          </h2>
          {firstStage ? (
            <p className="mt-2 text-sm text-foreground/64">
              Complete timing rows from the seeded `StageResult` data.
            </p>
          ) : null}
        </div>

        {firstStage ? <StageTimingTable results={firstStage.stageResults} /> : null}
      </section>
    </main>
  );
}
