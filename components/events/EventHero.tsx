import { CalendarDays, MapPin, Medal, Mountain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import type { VerifiedEventFact } from "@/data/verified/types";
import { buildOverview, winnerName } from "./helpers";
import type { EventDetail, EventResult } from "./types";

export function EventHero({
  event,
  verifiedFact,
  terrain,
  elevation,
}: {
  event: EventDetail;
  verifiedFact: VerifiedEventFact | null;
  terrain: string;
  elevation: string;
}) {
  const podium = event.results
    .filter(
      (result) =>
        verifiedFact && result.overallPosition !== null && result.overallPosition <= 3,
    )
    .sort((a, b) => (a.overallPosition ?? 999) - (b.overallPosition ?? 999));

  return (
    <section className="relative overflow-hidden border-b border-border bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,hsl(24_92%_48%/0.34),transparent_34%),linear-gradient(135deg,hsl(0_0%_2%),hsl(0_0%_8%)_48%,hsl(24_80%_18%))]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
      <Container className="relative grid min-h-[720px] items-end gap-10 pb-12 pt-32 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-8">
            <Breadcrumb
              items={[{ label: "Events", href: "/events" }, { label: event.name }]}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{event.liveStatus}</Badge>
            <Badge className="border-white/20 bg-white/10 text-white">
              Round {event.roundNumber ?? "TBC"}
            </Badge>
            <Badge className="border-white/20 bg-white/10 text-white">
              {event.season.year}
            </Badge>
          </div>
          <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.92] tracking-normal md:text-7xl lg:text-8xl">
            {event.name}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-white/[0.72] md:text-lg">
            {verifiedFact?.eventDescription?.value ??
              buildOverview(event, terrain, elevation)}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold text-white/[0.72]">
            <HeroFact
              icon={MapPin}
              value={`${event.country?.name ?? "Country TBC"} • ${
                event.city ?? event.venue ?? "Location TBC"
              }`}
            />
            <HeroFact
              icon={CalendarDays}
              value={formatHeroDateRange(event.startDate, event.endDate)}
            />
            <HeroFact icon={Mountain} value={formatElevation(elevation)} />
          </div>
        </div>

        <div className="grid gap-4">
          <Card className="overflow-hidden border-white/14 bg-white/[0.06] text-white shadow-2xl shadow-black/30">
            <RaceImagePlaceholder eventName={event.name} />
          </Card>
          <HeroPodiumBlock podium={podium} />
        </div>
      </Container>
    </section>
  );
}

function RaceImagePlaceholder({ eventName }: { eventName: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[linear-gradient(155deg,hsl(0_0%_4%),hsl(0_0%_13%)_34%,hsl(28_30%_18%)_57%,hsl(24_74%_24%)_100%)]" />
      <div className="absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_24%_18%,hsl(24_94%_52%/0.26),transparent_26%),radial-gradient(circle_at_72%_24%,hsl(0_0%_96%/0.11),transparent_18%),linear-gradient(153deg,transparent_0_44%,hsl(0_0%_0%/0.5)_44%_52%,transparent_52%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-[linear-gradient(170deg,transparent_0_30%,hsl(0_0%_0%/0.68)_31%),repeating-linear-gradient(108deg,hsl(0_0%_80%/0.12)_0_1px,transparent_1px_16px)]" />
      <div className="absolute bottom-[18%] left-[12%] h-[20%] w-[34%] -skew-x-12 rounded-sm bg-white/[0.08] blur-[1px]" />
      <div className="absolute bottom-[20%] left-[38%] h-[26%] w-[22%] -skew-x-12 rounded-sm bg-accent/20 blur-[2px]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/70 to-transparent" />
      <div className="absolute bottom-5 left-5 right-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Event image
        </p>
        <h2 className="mt-2 max-w-md text-2xl font-black leading-none">
          {eventName.replace(/\s+\d{4}$/, "")}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-white/[0.62]">
          Official media placeholder ready for approved race photography.
        </p>
      </div>
    </div>
  );
}

function HeroPodiumBlock({ podium }: { podium: EventResult[] }) {
  const slots = [1, 2, 3];

  return (
    <Card className="border-white/12 bg-white/[0.06] p-5 text-white shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Podium
        </p>
        <Medal className="h-5 w-5 text-accent" aria-hidden="true" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {slots.map((position) => (
          <PodiumRider
            key={position}
            position={position}
            result={podium.find((item) => item.overallPosition === position) ?? null}
          />
        ))}
      </div>
    </Card>
  );
}

function PodiumRider({
  position,
  result,
}: {
  position: number;
  result: EventResult | null;
}) {
  const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : "🥉";
  const manufacturer =
    result?.manufacturer?.name ?? result?.motorcycle?.manufacturer.name ?? "TBC";

  return (
    <div className="rounded-md border border-white/10 bg-black/26 p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/[0.5]">
        {medal} Position {position}
      </p>
      <div className="mx-auto mt-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/14 bg-[radial-gradient(circle_at_35%_25%,hsl(24_85%_45%/0.55),hsl(0_0%_13%)_58%,hsl(0_0%_4%))] text-2xl font-black text-white shadow-xl shadow-black/30">
        {result ? getInitials(result.rider) : "TBC"}
      </div>
      <h3 className="mt-4 min-h-[44px] text-base font-black leading-tight">
        {result ? winnerName(result.rider) : "Coming Soon"}
      </h3>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-sm border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.64]">
          {result?.rider.country?.isoCode ?? "TBC"}
        </span>
        <span className="rounded-sm border border-accent/30 bg-accent/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
          {manufacturer}
        </span>
      </div>
    </div>
  );
}

function HeroFact({ icon: Icon, value }: { icon: typeof MapPin; value: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
      {value}
    </span>
  );
}

function formatHeroDateRange(startDate: Date, endDate?: Date | null) {
  const month = new Intl.DateTimeFormat("en", { month: "short" }).format(startDate);
  const startDay = new Intl.DateTimeFormat("en", { day: "numeric" }).format(startDate);
  const year = new Intl.DateTimeFormat("en", { year: "numeric" }).format(startDate);

  if (!endDate) {
    return `${month} ${startDay}, ${year}`;
  }

  const endMonth = new Intl.DateTimeFormat("en", { month: "short" }).format(endDate);
  const endDay = new Intl.DateTimeFormat("en", { day: "numeric" }).format(endDate);
  const endYear = new Intl.DateTimeFormat("en", { year: "numeric" }).format(endDate);

  if (month === endMonth && year === endYear) {
    return `${month} ${startDay}-${endDay}, ${year}`;
  }

  return `${month} ${startDay}, ${year} - ${endMonth} ${endDay}, ${endYear}`;
}

function formatElevation(elevation: string) {
  return elevation ? `${elevation} Elevation` : "Elevation TBC";
}

function getInitials(rider: EventResult["rider"]) {
  return `${rider.firstName[0] ?? ""}${rider.lastName[0] ?? ""}`;
}
