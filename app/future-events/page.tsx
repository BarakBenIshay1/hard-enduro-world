import { ArrowRight, CalendarDays, Clock, MapPin, Radio, Youtube } from "lucide-react";
import type { ReactNode } from "react";
import { RaceStatusBadge } from "@/components/events/RaceStatusBadge";
import {
  getRaceStatus,
  getRaceStatusPriority,
  type RaceStatusView,
} from "@/components/events/race-status";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { getEventsList } from "@/db/events";
import { formatDateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Race Live Center",
  description: "Follow the active race, latest official media, and next event updates.",
};

type EventListItem = Awaited<ReturnType<typeof getEventsList>>[number];
type EventWithStatus = {
  event: EventListItem;
  raceStatus: RaceStatusView;
};

export default async function FutureEventsPage() {
  const events = await getEventsList();
  const currentSeasonEvents = events
    .map((event) => ({ event, raceStatus: getRaceStatus(event) }))
    .filter(({ event }) => event.season.year === 2026)
    .sort((a, b) => {
      const priority =
        getRaceStatusPriority(a.raceStatus.phase) -
        getRaceStatusPriority(b.raceStatus.phase);

      if (priority !== 0) {
        return priority;
      }

      return a.event.startDate.getTime() - b.event.startDate.getTime();
    });
  const liveEvents = currentSeasonEvents.filter(
    ({ raceStatus }) => raceStatus.phase === "live-now",
  );
  const nextRace =
    liveEvents.length === 0
      ? currentSeasonEvents.find(({ raceStatus }) => raceStatus.phase === "coming-soon")
      : null;

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Race Live Center"
        title="Race Live Center"
        description="Follow the active race, latest official media, and next event updates."
      />

      <Container className="grid gap-10 py-12">
        {liveEvents.length > 0 ? (
          <>
            <section>
              <SectionTitle
                eyebrow="Live Now"
                title="Active race control"
                description="No live timing is connected yet. This hub keeps the active event visible without inventing live data."
              />
              <div className="mt-8 grid gap-5">
                {liveEvents.map((item) => (
                  <LiveEventCard key={item.event.id} item={item} />
                ))}
              </div>
            </section>
            <OfficialMediaPanel eventName={liveEvents[0].event.name} />
          </>
        ) : nextRace ? (
          <>
            <section>
              <SectionTitle
                eyebrow="Next Race"
                title="Next race on the championship calendar"
                description="No race is live right now. The next 2026 round is ready for event-page coverage and official updates."
              />
              <div className="mt-8">
                <NextRaceCard item={nextRace} />
              </div>
            </section>
            <OfficialMediaPanel eventName={nextRace.event.name} />
          </>
        ) : (
          <EmptyState
            title="No live or upcoming 2026 events"
            description="Open the Events archive to browse completed rounds and previous seasons."
          />
        )}
      </Container>
    </main>
  );
}

function LiveEventCard({ item }: { item: EventWithStatus }) {
  const { event, raceStatus } = item;

  return (
    <Card className="overflow-hidden border-red-500/24 bg-black text-white shadow-[0_0_38px_hsl(0_84%_60%/0.14)]">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <RaceImagePlaceholder event={event} raceStatus={raceStatus} />
        <div className="grid content-between gap-8 p-6 lg:p-8">
          <div>
            <RaceStatusBadge raceStatus={raceStatus} />
            <h2 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
              {event.name}
            </h2>
            <div className="mt-5 grid gap-3 text-sm text-white/[0.72] sm:grid-cols-2">
              <EventMeta icon={MapPin}>
                {event.country?.name ?? "Country TBC"} •{" "}
                {event.city ?? event.venue ?? "Location TBC"}
              </EventMeta>
              <EventMeta icon={CalendarDays}>
                {formatDateRange(event.startDate, event.endDate)}
              </EventMeta>
            </div>
          </div>

          <div className="grid gap-3">
            <LiveInfoCard
              label="Current stage"
              value="Live stage data pending official integration."
            />
            <LiveInfoCard
              label="Latest update"
              value="Latest official updates will appear here after source tracking is connected."
            />
            <LiveInfoCard
              label="Coverage"
              value="Live coverage coming soon. No live timing or results are generated."
            />
          </div>

          <ButtonLink href={`/events/${event.slug}`} className="w-full">
            Open Full Event <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}

function NextRaceCard({ item }: { item: EventWithStatus }) {
  const { event, raceStatus } = item;

  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <RaceImagePlaceholder event={event} raceStatus={raceStatus} />
        <div className="grid gap-6 p-6 lg:p-8">
          <div>
            <RaceStatusBadge raceStatus={raceStatus} />
            <h2 className="mt-5 text-4xl font-black leading-tight">{event.name}</h2>
            <p className="mt-3 text-sm leading-6 text-foreground/[0.62]">
              Countdown-ready event card. Exact start time is shown when official timing
              data is available.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-foreground/[0.68] sm:grid-cols-2">
            <EventMeta icon={MapPin}>
              {event.country?.name ?? "Country TBC"} •{" "}
              {event.city ?? event.venue ?? "Location TBC"}
            </EventMeta>
            <EventMeta icon={CalendarDays}>
              {formatDateRange(event.startDate, event.endDate)}
            </EventMeta>
            <EventMeta icon={Clock}>{formatEventTime(event.startDate)}</EventMeta>
          </div>
          <ButtonLink href={`/events/${event.slug}`} className="w-full">
            Open Event <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}

function RaceImagePlaceholder({
  event,
  raceStatus,
}: {
  event: EventListItem;
  raceStatus: RaceStatusView;
}) {
  const live = raceStatus.phase === "live-now";

  return (
    <div className="relative min-h-[360px] overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_4%),hsl(203_70%_16%)_46%,hsl(24_82%_20%))]" />
      <div className="absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_28%_22%,hsl(199_89%_48%/0.22),transparent_28%),radial-gradient(circle_at_78%_20%,hsl(24_94%_52%/0.18),transparent_20%),linear-gradient(155deg,transparent_0_42%,hsl(0_0%_0%/0.45)_43%_52%,transparent_53%)]" />
      <div className="absolute bottom-[18%] left-[12%] h-[18%] w-[36%] -skew-x-12 rounded-sm bg-white/[0.08] blur-[1px]" />
      <div className="absolute bottom-[20%] left-[40%] h-[24%] w-[22%] -skew-x-12 rounded-sm bg-accent/20 blur-[2px]" />
      <div className="absolute left-5 top-5 rounded-md border border-white/[0.14] bg-black/[0.45] px-4 py-3 text-white backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
          {live ? "Live event image" : "Next race image"}
        </p>
        <p className="mt-1 font-black uppercase tracking-[0.16em]">
          {event.country?.isoCode ?? "TBC"}
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Official media placeholder
        </p>
        <h3 className="mt-2 text-3xl font-black leading-tight">
          {event.name.replace(/\s+\d{4}$/, "")}
        </h3>
      </div>
    </div>
  );
}

function OfficialMediaPanel({ eventName }: { eventName: string }) {
  const sources = [
    "Red Bull Motorsports",
    "Event official channel",
    "Championship official media",
  ];

  return (
    <section>
      <SectionTitle
        eyebrow="Official Media"
        title="Current-event media"
        description="Latest official videos will appear here after the review-first YouTube workflow is connected."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {sources.map((source) => (
          <Card key={source} className="p-5">
            <div className="flex items-center justify-between gap-4">
              <Youtube className="h-5 w-5 text-accent" aria-hidden="true" />
              <span className="rounded-sm border border-border bg-surface-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/[0.54]">
                Source-aware
              </span>
            </div>
            <h3 className="mt-5 text-lg font-black">{source}</h3>
            <p className="mt-2 text-sm leading-6 text-foreground/[0.62]">
              {eventName} official video placeholder. No API call or external fetch is
              performed.
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function LiveInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-4">
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-red-300" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/[0.48]">
          {label}
        </p>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/[0.72]">{value}</p>
    </div>
  );
}

function EventMeta({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
      {children}
    </span>
  );
}

function formatEventTime(date: Date) {
  if (date.getHours() === 0 && date.getMinutes() === 0) {
    return "Time TBC";
  }

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
