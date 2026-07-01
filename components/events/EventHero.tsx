import { CalendarDays, Flag, MapPin, Mountain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import type { VerifiedEventFact } from "@/data/verified/types";
import { formatDateRange } from "@/lib/format";
import { buildManufacturerRows, buildOverview, winnerName } from "./helpers";
import type { EventDetail, EventResult } from "./types";

export function EventHero({
  event,
  verifiedFact,
  terrain,
  elevation,
  displayedFinishers,
  dnfCount,
  dnsCount,
  dsqCount,
}: {
  event: EventDetail;
  verifiedFact: VerifiedEventFact | null;
  terrain: string;
  elevation: string;
  displayedFinishers: number;
  dnfCount: number;
  dnsCount: number;
  dsqCount: number;
}) {
  const manufacturerRows = buildManufacturerRows(event.results);
  const podium = event.results
    .filter((result) => result.overallPosition !== null && result.overallPosition <= 3)
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
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-white/[0.72]">
            <HeroFact icon={Flag} value={event.country?.name ?? "Country TBC"} />
            <HeroFact icon={MapPin} value={event.city ?? event.venue ?? "Location TBC"} />
            <HeroFact
              icon={CalendarDays}
              value={formatDateRange(event.startDate, event.endDate)}
            />
            <HeroFact icon={Mountain} value={elevation || "Elevation TBC"} />
          </div>
        </div>

        <div className="grid gap-4">
          <Card className="overflow-hidden border-white/14 bg-white/[0.06] text-white">
            <RaceImagePlaceholder eventName={event.name} />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <BrandBlock
                label="Event brand"
                value={event.name.replace(/\s+\d{4}$/, "")}
              />
              <BrandBlock
                label="Factory focus"
                value={manufacturerRows[0]?.name ?? "Demo paddock"}
              />
            </div>
          </Card>
          {verifiedFact ? (
            <HeroPodiumBlock podium={podium} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickStat label="Riders" value={String(event.results.length)} />
              <QuickStat label="Stages" value={String(event.stages.length)} />
              <QuickStat label="Finishers" value={String(displayedFinishers)} />
              <QuickStat
                label="DNF / DNS / DSQ"
                value={`${dnfCount}/${dnsCount}/${dsqCount}`}
              />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

function RaceImagePlaceholder({ eventName }: { eventName: string }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,hsl(0_0%_5%),hsl(0_0%_12%)_38%,hsl(24_70%_18%)_78%,hsl(42_58%_22%))]" />
      <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_22%_18%,hsl(24_94%_52%/0.28),transparent_28%),radial-gradient(circle_at_78%_20%,hsl(0_0%_92%/0.12),transparent_22%),linear-gradient(160deg,transparent_0_46%,hsl(0_0%_0%/0.45)_46%_54%,transparent_54%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(172deg,transparent_0_40%,hsl(0_0%_0%/0.72)_41%),repeating-linear-gradient(104deg,hsl(0_0%_72%/0.12)_0_1px,transparent_1px_18px)]" />
      <div className="absolute bottom-5 left-5 right-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Official media slot
        </p>
        <h2 className="mt-2 max-w-md text-2xl font-black leading-none">
          {eventName.replace(/\s+\d{4}$/, "")}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-white/[0.62]">
          Race image pending approved official media.
        </p>
      </div>
    </div>
  );
}

function HeroPodiumBlock({ podium }: { podium: EventResult[] }) {
  return (
    <Card className="border-white/12 bg-white/[0.06] p-5 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        Podium
      </p>
      <div className="mt-4 grid gap-3">
        {podium.map((result) => (
          <div
            key={result.id}
            className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-md border border-white/10 bg-black/24 px-3 py-2"
          >
            <span className="text-lg font-black text-accent">
              {result.overallPosition}.
            </span>
            <span className="font-semibold">{winnerName(result.rider)}</span>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/[0.52]">
              {result.manufacturer?.name ??
                result.motorcycle?.manufacturer.name ??
                result.rider.country?.isoCode ??
                "TBC"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HeroFact({ icon: Icon, value }: { icon: typeof Flag; value: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
      {value}
    </span>
  );
}

function BrandBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/12 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/[0.52]">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-white/12 bg-white/[0.06] p-4 text-white">
      <p className="text-xs uppercase tracking-[0.18em] text-white/[0.5]">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </Card>
  );
}
