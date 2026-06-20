import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getEventsList } from "@/db/events";
import { formatDateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Events",
  description: "Hard Enduro World Championship event calendar and seeded results.",
};

export default async function EventsPage() {
  const events = await getEventsList();

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
          Events
        </p>
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
          Championship event data
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-foreground/72">
          The first events listing reads directly from the seeded PostgreSQL data through
          Prisma.
        </p>

        <div className="mt-10 grid gap-4">
          {events.map((event) => {
            const winner = event.results[0]?.rider;

            return (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="rounded-md border border-border bg-surface-muted p-5 transition hover:border-accent"
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_220px_180px] lg:items-center">
                  <div>
                    <p className="text-sm text-foreground/64">
                      Round {event.roundNumber ?? "TBC"} • {event.season.name}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">{event.name}</h2>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-foreground/68">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        {formatDateRange(event.startDate, event.endDate)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        {event.country?.name ?? "Location TBC"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-surface px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-foreground/52">
                      Stages
                    </p>
                    <p className="mt-1 text-xl font-semibold">{event.stages.length}</p>
                  </div>

                  <div className="rounded-md border border-border bg-surface px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-foreground/52">
                      Leader
                    </p>
                    <p className="mt-1 font-semibold">
                      {winner ? `${winner.firstName} ${winner.lastName}` : "Pending"}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
