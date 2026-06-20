import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CirclePlay,
  Clock,
  Crown,
  Flag,
  Globe2,
  MapPin,
  Medal,
  Mountain,
  Newspaper,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Countdown } from "@/components/home/countdown";
import { Reveal } from "@/components/home/reveal";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionTitle } from "@/components/ui/section-title";

export const metadata: Metadata = {
  title: "Hard Enduro World Championship",
  description:
    "The premium global home for Hard Enduro championship events, riders, timing, stories, videos, and records.",
  alternates: {
    canonical: "/",
  },
};

const nextEvent = {
  name: "Sample Hard Enduro GP",
  country: "Austria",
  dateLabel: "June 1-3, 2026",
  targetDate: "2026-06-01T08:00:00.000Z",
  href: "/events/sample-hard-enduro-gp-2026",
};

const standings = [
  {
    position: 1,
    rider: "Manuel Lettenbichler",
    team: "Red Bull KTM Factory Racing",
    manufacturer: "KTM",
    points: 20,
  },
  {
    position: 2,
    rider: "Mario Roman",
    team: "Factory Sherco Racing",
    manufacturer: "Sherco",
    points: 17,
  },
  {
    position: 3,
    rider: "Billy Bolt",
    team: "Husqvarna Factory Racing",
    manufacturer: "Husqvarna",
    points: 15,
  },
  {
    position: 4,
    rider: "Trystan Hart",
    team: "FMF KTM Factory Racing",
    manufacturer: "KTM",
    points: 13,
  },
];

const news = [
  {
    title: "The new era of Hard Enduro data begins",
    summary:
      "A championship archive designed for race timing, stories, machines, and long-term history.",
  },
  {
    title: "Inside the prologue: where events are decided early",
    summary:
      "The opening stage sets rhythm, pressure, and the first measurable gap between contenders.",
  },
  {
    title: "Why motorcycle history matters in extreme terrain",
    summary:
      "The platform will connect riders, manufacturers, and machines across seasons and events.",
  },
];

const videos = [
  "Prologue rhythm: speed before survival",
  "Inside the paddock before race week",
  "The mountain decides the final day",
];

const galleryTiles = ["lg:row-span-2", "", "", "md:col-span-2 lg:col-span-1", "", ""];

const stats = [
  { label: "Total Riders", value: "1", icon: Users },
  { label: "Total Events", value: "1", icon: CalendarDays },
  { label: "Championships", value: "1", icon: Crown },
  { label: "Manufacturers", value: "1", icon: Mountain },
  { label: "Countries", value: "1", icon: Globe2 },
];

const sponsors = ["KTM", "HEWC", "MOTO", "RACE", "MEDIA", "DATA"];

function VisualPlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md border border-white/10 bg-black ${className ?? ""}`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_8%),hsl(24_92%_18%)_48%,hsl(42_70%_28%))]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.16),transparent)] opacity-[0.45]" />
      <div className="absolute bottom-4 left-4 rounded-sm border border-white/[0.14] bg-black/[0.42] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/[0.72] backdrop-blur">
        {label}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="bg-surface text-foreground">
      <section className="relative flex min-h-screen items-end overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_3%),hsl(220_11%_9%)_38%,hsl(24_92%_16%)_70%,hsl(0_0%_2%))]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82),rgba(0,0,0,0.28)_48%,rgba(0,0,0,0.72))]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute right-[8vw] top-[22vh] hidden h-[52vh] w-[28vw] skew-x-[-10deg] border border-white/10 bg-white/[0.035] lg:block" />

        <Container className="relative z-10 pb-12 pt-36 sm:pb-16 lg:pb-20">
          <Reveal>
            <Badge className="border-white/[0.18] bg-white/10 text-white">
              Hard Enduro World Championship
            </Badge>
            <h1 className="mt-6 max-w-6xl text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl xl:text-9xl">
              The global home of Hard Enduro.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/[0.72] sm:text-xl">
              Events, riders, machines, timing, records, and stories built into one
              definitive championship platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/championship">Explore Championship</ButtonLink>
              <ButtonLink href={nextEvent.href} variant="secondary">
                Next Event
              </ButtonLink>
            </div>
          </Reveal>

          <div className="mt-14 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/[0.48]">
            <span className="h-px w-10 bg-accent" />
            Scroll
            <span className="h-8 w-px animate-pulse bg-white/30" />
          </div>
        </Container>
      </section>

      <section className="border-y border-border bg-black text-white">
        <Container className="grid gap-8 py-10 lg:grid-cols-[1fr_520px] lg:items-center">
          <Reveal>
            <Badge>Next Event</Badge>
            <h2 className="mt-4 text-3xl font-semibold sm:text-5xl">{nextEvent.name}</h2>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-white/[0.64]">
              <span className="inline-flex items-center gap-2">
                <Flag className="h-4 w-4 text-accent" />
                {nextEvent.country}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                {nextEvent.dateLabel}
              </span>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <Countdown targetDate={nextEvent.targetDate} />
            <ButtonLink href={nextEvent.href} className="mt-5 w-full">
              Open Event
            </ButtonLink>
          </Reveal>
        </Container>
      </section>

      <Container className="grid gap-14 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <Reveal>
          <VisualPlaceholder label="Featured Event" className="aspect-[16/11]" />
        </Reveal>
        <Reveal delay={0.08}>
          <SectionTitle
            eyebrow="Featured Event"
            title="Iron Mountain opens the season with pressure from the first flag."
            description="A seeded preview of the event experience: location, winner context, stage timing, and a route into the first public event detail page."
          />
          <div className="mt-6 grid gap-3 text-sm text-foreground/[0.68]">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              Eisenerz, Austria
            </span>
            <span className="inline-flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" />
              Previous winner: Manuel Lettenbichler
            </span>
          </div>
          <ButtonLink href={nextEvent.href} className="mt-8">
            Explore Event
          </ButtonLink>
        </Reveal>
      </Container>

      <section className="border-y border-border bg-surface-muted">
        <Container className="py-16">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <SectionTitle
              eyebrow="Championship Preview"
              title="The first standings view, shaped for speed and clarity."
            />
            <ButtonLink href="/standings" variant="secondary">
              View Full Standings
            </ButtonLink>
          </div>
          <Reveal>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-black text-white">
                    <tr>
                      {["Pos", "Rider", "Team", "Manufacturer", "Points"].map(
                        (heading) => (
                          <th key={heading} className="px-5 py-4 font-semibold">
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row) => (
                      <tr key={row.rider} className="border-t border-border">
                        <td className="px-5 py-4 text-lg font-black text-accent">
                          {row.position}
                        </td>
                        <td className="px-5 py-4 font-semibold">{row.rider}</td>
                        <td className="px-5 py-4 text-foreground/[0.68]">{row.team}</td>
                        <td className="px-5 py-4">{row.manufacturer}</td>
                        <td className="px-5 py-4 font-mono font-semibold">
                          {row.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Reveal>
        </Container>
      </section>

      <Container className="grid gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal>
          <VisualPlaceholder label="Featured Rider" className="aspect-[4/5]" />
        </Reveal>
        <Reveal delay={0.08}>
          <SectionTitle
            eyebrow="Featured Rider"
            title="Manuel Lettenbichler"
            description="A rider spotlight preview for the future profile system, connecting biography, results, motorcycles, and long-term career history."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["Wins", "1"],
              ["Championships", "1"],
              ["Podiums", "1"],
            ].map(([label, value]) => (
              <Card key={label} className="p-5">
                <p className="text-sm text-foreground/[0.58]">{label}</p>
                <p className="mt-1 text-3xl font-black">{value}</p>
              </Card>
            ))}
          </div>
          <ButtonLink href="/riders/manuel-lettenbichler" className="mt-8">
            Explore Profile
          </ButtonLink>
        </Reveal>
      </Container>

      <section className="border-y border-border bg-black text-white">
        <Container className="py-16">
          <SectionTitle eyebrow="Latest News" title="Stories from the edge of control." />
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {news.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.05}>
                <Card className="h-full overflow-hidden bg-white/[0.045] text-white">
                  <VisualPlaceholder
                    label="News"
                    className="aspect-[16/10] rounded-none"
                  />
                  <div className="p-5">
                    <Newspaper className="h-5 w-5 text-accent" />
                    <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/[0.58]">
                      {item.summary}
                    </p>
                    <Link
                      href="/news"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent"
                    >
                      Read more <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle eyebrow="Latest Videos" title="Race-week energy in motion." />
          <ButtonLink href="/videos" variant="secondary">
            View Videos
          </ButtonLink>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {videos.map((title, index) => (
            <Reveal key={title} delay={index * 0.05}>
              <Card className="overflow-hidden">
                <div className="relative">
                  <VisualPlaceholder
                    label="Video"
                    className="aspect-video rounded-none"
                  />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-[0_18px_44px_hsl(var(--accent)/0.35)]">
                      <CirclePlay className="h-7 w-7" />
                    </div>
                  </div>
                </div>
                <h3 className="p-5 text-lg font-semibold">{title}</h3>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>

      <section className="border-y border-border bg-surface-muted">
        <Container className="py-16">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <SectionTitle
              eyebrow="Gallery"
              title="A visual archive built for the sport."
            />
            <ButtonLink href="/gallery" variant="secondary">
              Full Gallery
            </ButtonLink>
          </div>
          <div className="grid auto-rows-[180px] gap-4 md:grid-cols-2 lg:grid-cols-4">
            {galleryTiles.map((className, index) => (
              <Reveal key={index} delay={index * 0.03} className={className}>
                <VisualPlaceholder
                  label={`Gallery ${index + 1}`}
                  className="h-full min-h-[180px]"
                />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <SectionTitle
          eyebrow="Statistics"
          title="The archive starts small, and is built to scale for decades."
        />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Reveal key={stat.label} delay={index * 0.04}>
                <Card className="p-5">
                  <Icon className="h-5 w-5 text-accent" />
                  <p className="mt-8 text-3xl font-black">{stat.value}</p>
                  <p className="mt-1 text-sm text-foreground/60">{stat.label}</p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </Container>

      <section className="bg-black text-white">
        <Container className="grid gap-10 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <Reveal>
            <SectionTitle
              eyebrow="Interactive World"
              title="A future map for the global Hard Enduro landscape."
              description="The world map module will connect countries, venues, events, riders, and historical results in a later approved step."
            />
            <ButtonLink href="/interactive-map" className="mt-8">
              Preview Map Module
            </ButtonLink>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="relative min-h-[360px] overflow-hidden rounded-md border border-white/[0.12] bg-white/[0.045]">
              <div className="absolute inset-8 rounded-md border border-white/10" />
              <div className="absolute left-[18%] top-[34%] h-3 w-3 rounded-full bg-accent shadow-[0_0_34px_hsl(var(--accent))]" />
              <div className="absolute left-[52%] top-[44%] h-3 w-3 rounded-full bg-gold shadow-[0_0_34px_hsl(var(--gold))]" />
              <div className="absolute left-[70%] top-[28%] h-3 w-3 rounded-full bg-redline shadow-[0_0_34px_hsl(var(--redline))]" />
              <p className="absolute bottom-6 left-6 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                Map placeholder
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-border bg-surface-muted">
        <Container className="py-12">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.22em] text-foreground/[0.46]">
            Sponsors placeholder
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor}
                className="rounded-md border border-border bg-card px-4 py-6 text-center text-sm font-black uppercase tracking-[0.2em] text-foreground/[0.52]"
              >
                {sponsor}
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <Card className="overflow-hidden bg-black text-white">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_520px] lg:items-center lg:p-10">
            <div>
              <Badge>Newsletter</Badge>
              <h2 className="mt-5 text-3xl font-semibold sm:text-5xl">
                Race alerts, records, and stories from the hard line.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/[0.58]">
                Subscription capture placeholder for future updates, race-week alerts, and
                new archive releases.
              </p>
            </div>
            <form
              className="grid gap-3 sm:grid-cols-[1fr_auto]"
              aria-label="Newsletter signup"
            >
              <input
                type="email"
                placeholder="Email address"
                className="h-12 rounded-md border border-white/[0.14] bg-white/[0.08] px-4 text-sm text-white placeholder:text-white/[0.42] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              />
              <button
                type="button"
                className="h-12 rounded-md bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accent-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Subscribe
              </button>
            </form>
          </div>
        </Card>
      </Container>

      <section className="border-t border-border bg-hero text-white">
        <Container className="py-20 text-center">
          <Medal className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-black uppercase leading-tight sm:text-6xl">
            Enter the championship archive.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-white/60">
            Start with the first event slice, then expand toward the definitive global
            Hard Enduro platform.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/events">
              Explore Championship <Zap className="ml-2 h-4 w-4" />
            </ButtonLink>
          </div>
        </Container>
      </section>
    </main>
  );
}
