import { ClipboardList, Download, Trophy, Users } from "lucide-react";
import type { StageTimingResult } from "@/components/stage-timing-table";
import type { VerifiedEventFact } from "@/data/verified/types";
import { formatOptional } from "@/lib/format";
import type {
  CrossLink,
  EventDetail,
  EventResult,
  EventStage,
  OfficialLinkItem,
} from "./types";

export const UNKNOWN_VERIFIED_VALUE = "Verified data coming soon";

export function buildEventDashboardPlaceholderFact(
  event: EventDetail,
): VerifiedEventFact {
  const pending = (notes: string) => ({
    value: null,
    sourceIds: [],
    notes,
  });

  return {
    eventSlug: event.slug,
    displayName: event.name,
    previousWinner: null,
    verifiedWinner: null,
    verifiedFinisherCount: null,
    factsNote:
      "Public dashboard placeholder only. Verified event facts have not been attached yet.",
    sourceIds: [],
    eventDescription: {
      value: event.description,
      sourceIds: [],
      notes:
        "Existing event description shown as page context; official verification pending.",
    },
    historySummary: pending("Event history pending official verification."),
    terrainDescription: pending("Terrain details pending official verification."),
    elevation: pending("Elevation pending official verification."),
    distance: pending("Distance pending official verification."),
    checkpointCount: pending("Checkpoint count pending official verification."),
    eventFormat: pending("Event format pending official verification."),
    prologueExplanation: pending("Prologue details pending official verification."),
    mainRaceExplanation: pending("Main race details pending official verification."),
    finishRate: pending("Finish rate pending verified starters and finishers."),
    weather: pending("Weather pending official or provider verification."),
    officialOrganizer: pending("Official organizer pending verification."),
    participants: {
      registeredRiders: pending("Registered riders pending official entry list."),
      confirmedStarters: pending("Confirmed starters pending official start list."),
      verifiedFinishers: pending("Finishers pending official classification."),
      dnf: pending("DNF count pending official classification."),
      dns: pending("DNS count pending official classification."),
      dsq: pending("DSQ count pending official classification."),
    },
    manufacturerContext: {
      factoryParticipation: pending("Factory participation pending official source."),
      participatingManufacturers: pending(
        "Participating manufacturers pending official entry list.",
      ),
      factoryRiders: pending("Factory riders pending official verification."),
      privateRiders: pending("Private riders pending official verification."),
    },
    teamContext: {
      factoryTeams: pending("Factory teams pending official verification."),
      independentTeams: pending("Independent teams pending official verification."),
      supportTeams: pending("Support teams pending official verification."),
    },
    motorcycleContext: {
      motorcycleModels: pending("Motorcycle models pending official verification."),
      engineSize: pending("Engine sizes pending official verification."),
      manufacturer: pending("Motorcycle manufacturers pending official verification."),
    },
    raceStatistics: {
      starters: pending("Starters pending official verification."),
      finishers: pending("Finishers pending official verification."),
      finishRate: pending("Finish rate pending official verification."),
      longestStage: pending("Longest stage pending official verification."),
      totalDistance: pending("Total distance pending official verification."),
      elevationGain: pending("Elevation gain pending official verification."),
      checkpointCount: pending("Checkpoint count pending official verification."),
    },
    eventTimeline: [
      {
        label: "Schedule",
        date: null,
        status: "TBC",
        description: null,
        sourceIds: [],
        notes: "Official schedule pending verification.",
      },
    ],
  };
}

export function mapTimingResults(
  results: EventStage["stageResults"],
): StageTimingResult[] {
  return results.map((result) => ({
    id: result.id,
    overallPosition: result.overallPosition,
    classPosition: result.classPosition,
    className: result.className,
    riderName: `${result.rider.firstName} ${result.rider.lastName}`,
    countryCode: result.rider.country?.isoCode ?? null,
    teamName: result.rider.teamMemberships[0]?.team.name ?? null,
    manufacturerName:
      result.manufacturer?.name ?? result.motorcycle?.manufacturer.name ?? null,
    motorcycleName: result.motorcycle
      ? `${result.motorcycle.manufacturer.name} ${result.motorcycle.model}${
          result.motorcycle.year ? ` ${result.motorcycle.year}` : ""
        }`
      : null,
    totalTimeText: result.totalTimeText,
    totalTimeMs: result.totalTimeMs,
    gapToLeaderText: result.gapToLeaderText,
    gapToLeaderMs: result.gapToLeaderMs,
    penaltiesText: result.penaltiesText,
    penaltiesMs: result.penaltiesMs,
    status: result.status,
  }));
}

export function buildStageCard(stage: EventStage, terrain: string, elevation: string) {
  const finishedResults = stage.stageResults.filter(
    (result) => result.status === "FINISHED",
  );
  const winner = finishedResults.find((result) => result.overallPosition === 1);
  const bestTime = finishedResults
    .filter((result) => result.totalTimeMs !== null)
    .sort((a, b) => (a.totalTimeMs ?? 0) - (b.totalTimeMs ?? 0))[0];
  const dnfCount = stage.stageResults.filter((result) => result.status === "DNF").length;

  return {
    id: stage.id,
    slug: stage.slug,
    order: stage.stageOrder,
    type: stage.stageType,
    name: stage.name,
    distance: stage.distanceKm ? `${stage.distanceKm.toString()} km` : "Distance TBC",
    terrain: terrain || "Demo technical hard enduro terrain",
    elevation: elevation || "Elevation TBC",
    winner: winner ? winnerName(winner.rider) : "Pending",
    bestTime: bestTime?.totalTimeText ?? "Pending",
    dnfCount: String(dnfCount),
    difficulty: getDifficultyLabel(stage.stageOrder),
  };
}

export function buildRiderCards(event: EventDetail) {
  return event.results.slice(0, 24).map((result) => {
    const standing = result.rider.standings.find(
      (item) => item.seasonId === event.seasonId,
    );

    return {
      slug: result.rider.slug,
      name: winnerName(result.rider),
      country: result.rider.country?.name ?? "Country TBC",
      team: getTeamName(result.rider),
      manufacturer:
        result.manufacturer?.name ?? result.motorcycle?.manufacturer.name ?? "TBC",
      motorcycle: result.motorcycle
        ? `${result.motorcycle.manufacturer.name} ${result.motorcycle.model}`
        : "TBC",
      championshipPosition: standing?.position ? `P${standing.position}` : "Unranked",
    };
  });
}

export function buildCrossNavigation(event: EventDetail) {
  const riders: CrossLink[] = [];
  const manufacturers: CrossLink[] = [];
  const teams: CrossLink[] = [];
  const motorcycles: CrossLink[] = [];
  const seen = new Set<string>();

  event.results.forEach((result) => {
    addCrossLink(seen, riders, {
      label: winnerName(result.rider),
      href: `/riders/${result.rider.slug}`,
      detail: `Verified row: ${formatOptional(result.overallPosition)}`,
    });

    const manufacturer = result.manufacturer ?? result.motorcycle?.manufacturer ?? null;
    if (manufacturer) {
      addCrossLink(seen, manufacturers, {
        label: manufacturer.name,
        href: `/manufacturers/${manufacturer.slug}`,
        detail: "Linked from verified result row",
      });
    }

    const team = result.rider.teamMemberships[0]?.team;
    if (team) {
      addCrossLink(seen, teams, {
        label: team.name,
        href: `/teams/${team.slug}`,
        detail: "Linked through rider profile",
      });
    }

    if (result.motorcycle) {
      addCrossLink(seen, motorcycles, {
        label: `${result.motorcycle.manufacturer.name} ${result.motorcycle.model}`,
        href: `/motorcycles/${result.motorcycle.slug}`,
        detail: result.motorcycle.year
          ? `${result.motorcycle.year} model`
          : "Linked from verified result row",
      });
    }
  });

  return { riders, manufacturers, teams, motorcycles };
}

function addCrossLink(seen: Set<string>, links: CrossLink[], link: CrossLink) {
  if (seen.has(link.href)) {
    return;
  }

  seen.add(link.href);
  links.push(link);
}

export function buildManufacturerRows(results: EventResult[]) {
  const map = new Map<
    string,
    { name: string; entries: number; best: number; wins: number; podiums: number }
  >();

  results.forEach((result) => {
    const name =
      result.manufacturer?.name ?? result.motorcycle?.manufacturer.name ?? "TBC";
    const current = map.get(name) ?? {
      name,
      entries: 0,
      best: 999,
      wins: 0,
      podiums: 0,
    };
    current.entries += 1;
    current.best = Math.min(current.best, result.overallPosition ?? 999);
    current.wins += result.overallPosition === 1 ? 1 : 0;
    current.podiums += result.overallPosition && result.overallPosition <= 3 ? 1 : 0;
    map.set(name, current);
  });

  return Array.from(map.values())
    .sort((a, b) => a.best - b.best)
    .map((row) => ({
      ...row,
      bestResult: row.best === 999 ? "TBC" : `P${row.best}`,
    }));
}

export function buildTeamRows(results: EventResult[]) {
  const map = new Map<
    string,
    { name: string; entries: number; best: number; wins: number; podiums: number }
  >();

  results.forEach((result) => {
    const name = getTeamName(result.rider);
    const current = map.get(name) ?? {
      name,
      entries: 0,
      best: 999,
      wins: 0,
      podiums: 0,
    };
    current.entries += 1;
    current.best = Math.min(current.best, result.overallPosition ?? 999);
    current.wins += result.overallPosition === 1 ? 1 : 0;
    current.podiums += result.overallPosition && result.overallPosition <= 3 ? 1 : 0;
    map.set(name, current);
  });

  return Array.from(map.values())
    .sort((a, b) => a.best - b.best)
    .map((row) => ({
      ...row,
      bestResult: row.best === 999 ? "TBC" : `P${row.best}`,
    }));
}

export function buildDocuments(event: EventDetail) {
  return [
    {
      icon: ClipboardList,
      title: "Regulations",
      description: "Demo regulations PDF placeholder prepared for source tracking.",
      status: "Preview PDF",
    },
    {
      icon: Users,
      title: "Entry list",
      description: `${event.results.length} seeded rider entries available in preview.`,
      status: "Seeded",
    },
    {
      icon: Trophy,
      title: "Final results",
      description: event.results.length
        ? "Final classification demo table is available."
        : "Final classification pending.",
      status: event.results.length ? "Available" : "Pending",
    },
    {
      icon: Download,
      title: "Download pack",
      description: "Future approved document bundle placeholder.",
      status: "Placeholder",
    },
  ];
}

export function buildOfficialLinks(
  eventFact: VerifiedEventFact | null,
): OfficialLinkItem[] {
  if (!eventFact) {
    return [];
  }

  return [
    eventFact.officialWebsite ? { ...eventFact.officialWebsite, group: "Website" } : null,
    ...(eventFact.officialSocialLinks ?? []).map((link) => ({
      ...link,
      group: "Social",
    })),
    ...(eventFact.officialYoutubeLinks ?? []).map((link) => ({
      ...link,
      group: "YouTube",
    })),
    ...(eventFact.officialDocumentPlaceholders ?? []).map((link) => ({
      ...link,
      group: "Documents",
    })),
  ].filter((link) => link !== null);
}

export function calculateVerifiedCoverage(eventFact: VerifiedEventFact) {
  const trackedValues: Array<string | number | null | undefined> = [
    eventFact.verifiedWinner,
    eventFact.verifiedFinisherCount,
    eventFact.eventDescription?.value,
    eventFact.historySummary?.value,
    eventFact.terrainDescription?.value,
    eventFact.elevation?.value,
    eventFact.distance?.value,
    eventFact.checkpointCount?.value,
    eventFact.eventFormat?.value,
    eventFact.prologueExplanation?.value,
    eventFact.mainRaceExplanation?.value,
    eventFact.finishRate?.value,
    eventFact.weather?.value,
    eventFact.officialOrganizer?.value,
    eventFact.officialWebsite?.url,
    eventFact.participants?.registeredRiders.value,
    eventFact.participants?.confirmedStarters.value,
    eventFact.participants?.verifiedFinishers.value,
    eventFact.participants?.dnf.value,
    eventFact.participants?.dns.value,
    eventFact.participants?.dsq.value,
    eventFact.raceStatistics?.starters.value,
    eventFact.raceStatistics?.finishers.value,
    eventFact.raceStatistics?.finishRate.value,
    eventFact.raceStatistics?.longestStage.value,
    eventFact.raceStatistics?.totalDistance.value,
    eventFact.raceStatistics?.elevationGain.value,
    eventFact.raceStatistics?.checkpointCount.value,
  ];
  const verified = trackedValues.filter(
    (value) => value !== null && value !== undefined && value !== "",
  ).length;
  const total = trackedValues.length;

  return {
    verified,
    total,
    percentage: Math.round((verified / total) * 100),
  };
}

export function buildMediaStats(mediaItems: EventDetail["mediaItems"]) {
  return {
    images: mediaItems.filter((item) => item.type === "IMAGE").length,
    videos: mediaItems.filter((item) => item.type === "VIDEO" || item.type === "YOUTUBE")
      .length,
    documents: mediaItems.filter((item) => item.type === "DOCUMENT").length,
  };
}

export function getTeamName(rider: EventResult["rider"]) {
  return rider.teamMemberships[0]?.team.name ?? "Independent";
}

export function winnerName(
  rider: { firstName: string; lastName: string } | null | undefined,
) {
  return rider ? `${rider.firstName} ${rider.lastName}` : "Pending";
}

export function buildOverview(event: EventDetail, terrain: string, elevation: string) {
  return `${event.country?.name ?? "Demo country"} hosts ${event.name}, a seeded championship event profile covering ${terrain || "hard enduro terrain"} with ${elevation || "event elevation"} and complete demo timing context.`;
}

export function extractDescriptionField(description: string | null, label: string) {
  if (!description) {
    return "";
  }

  const match = description.match(new RegExp(`${label}:\\s*([^.]*)`, "i"));
  return match?.[1]?.trim() ?? "";
}

export function parseOptionalInt(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getDifficultyLabel(seed: number | null | undefined) {
  const labels = ["Severe", "Extreme", "Technical", "Endurance", "Elite"];
  return labels[(seed ?? 0) % labels.length];
}

export function getTotalDistance(stages: EventStage[]) {
  const total = stages.reduce((sum, stage) => sum + Number(stage.distanceKm ?? 0), 0);
  return total > 0 ? `${Math.round(total)} km` : "Distance TBC";
}

export function getPodiumSweep(rows: Array<{ name: string; podiums: number }>) {
  const row = rows.find((item) => item.podiums >= 3);
  return row ? `${row.name} demo sweep` : "No seeded sweep";
}
