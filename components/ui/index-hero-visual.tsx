import {
  Bike,
  CalendarDays,
  Flag,
  Map,
  Medal,
  Route,
  ShieldCheck,
  CircleUserRound,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/cn";

type IndexHeroVisualKind = "riders" | "events" | "manufacturers" | "teams" | "history";

type VisualConfig = {
  title: string;
  subtitle: string;
  badge: string;
  Icon: typeof Bike;
  cards: Array<{ label: string; detail: string; icon: typeof Bike }>;
};

const visualConfigs: Record<IndexHeroVisualKind, VisualConfig> = {
  riders: {
    title: "Athlete Wall",
    subtitle: "Profiles, helmets, countries, and team connections.",
    badge: "Rider Grid",
    Icon: CircleUserRound,
    cards: [
      { label: "Profiles", detail: "Verified identity layer", icon: Users },
      { label: "Helmets", detail: "Portrait slots ready", icon: CircleUserRound },
      { label: "Countries", detail: "Flag-code support", icon: Flag },
    ],
  },
  events: {
    title: "Race Calendar",
    subtitle: "Rounds, routes, locations, and race-status signals.",
    badge: "Calendar Control",
    Icon: Map,
    cards: [
      { label: "Rounds", detail: "Current season first", icon: CalendarDays },
      { label: "Routes", detail: "Map-line structure", icon: Route },
      { label: "Locations", detail: "Country context", icon: Flag },
    ],
  },
  manufacturers: {
    title: "Factory Wall",
    subtitle: "Brand badges, machine lines, and technical identity.",
    badge: "Machine Layer",
    Icon: Bike,
    cards: [
      { label: "Brands", detail: "Factory badges", icon: ShieldCheck },
      { label: "Models", detail: "Bike families", icon: Bike },
      { label: "Setup", detail: "Technical evolution", icon: Wrench },
    ],
  },
  teams: {
    title: "Paddock Grid",
    subtitle: "Team crests, roster cards, and garage structures.",
    badge: "Team Lane",
    Icon: ShieldCheck,
    cards: [
      { label: "Garages", detail: "Organization layer", icon: ShieldCheck },
      { label: "Rosters", detail: "Rider structures", icon: Users },
      { label: "Partners", detail: "Manufacturer ties", icon: Wrench },
    ],
  },
  history: {
    title: "Archive Wall",
    subtitle: "Season cards, champions, trophies, and timeline records.",
    badge: "Historical Index",
    Icon: Trophy,
    cards: [
      { label: "Seasons", detail: "Year-by-year index", icon: CalendarDays },
      { label: "Champions", detail: "Verified winners", icon: Trophy },
      { label: "Records", detail: "Archive-ready", icon: Medal },
    ],
  },
};

export function IndexHeroVisual({ kind }: { kind: IndexHeroVisualKind }) {
  const config = visualConfigs[kind];
  const Icon = config.Icon;

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-md border border-white/[0.14] bg-white/[0.06] p-5 shadow-[0_28px_90px_hsl(0_0%_0%/0.28)] backdrop-blur">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_100%/0.05),transparent_42%),radial-gradient(circle_at_78%_22%,hsl(24_94%_52%/0.26),transparent_32%)]" />
      <div className="absolute left-8 right-8 top-1/2 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
      <div className="absolute bottom-10 left-10 right-12 h-24 rounded-[50%] border border-white/[0.10]" />
      <div className="relative flex h-full min-h-[320px] flex-col justify-between">
        <div className="flex items-center justify-between gap-4">
          <span className="rounded-sm border border-accent/35 bg-accent/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {config.badge}
          </span>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.14] bg-black/35">
            <Icon className="h-6 w-6 text-accent" aria-hidden="true" />
          </div>
        </div>

        <div className="grid gap-3">
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-white/[0.16] bg-black/35">
            <div className="absolute inset-3 rounded-full border border-accent/35" />
            <Icon className="h-12 w-12 text-accent" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black">{config.title}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/62">
              {config.subtitle}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {config.cards.map((card, index) => (
            <VisualCard
              key={card.label}
              label={card.label}
              detail={card.detail}
              icon={card.icon}
              raised={index === 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function VisualCard({
  label,
  detail,
  icon: Icon,
  raised,
}: {
  label: string;
  detail: string;
  icon: typeof Bike;
  raised?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-white/[0.12] bg-black/35 p-3 backdrop-blur",
        raised && "sm:-translate-y-4 sm:border-accent/35 sm:bg-accent/10",
      )}
    >
      <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
      <p className="mt-3 text-sm font-black">{label}</p>
      <p className="mt-1 text-xs leading-5 text-white/54">{detail}</p>
    </div>
  );
}
