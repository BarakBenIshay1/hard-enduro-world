import { officialSourceRegistry } from "./source-registry";
import type { VerifiedCoverageSummary, VerifiedEventCoverage } from "./types";

const defaultNeededResultTypes: VerifiedEventCoverage["neededResultTypes"] = [
  "overall-results",
  "stage-results",
  "standings",
  "finishers",
  "dns-dnf-dsq",
  "points",
];

const officialResultSources = [
  "FIM Hard Enduro official results",
  "Official event timing/classification PDF",
  "Official championship standings update",
];

const scheduledSources = [
  "Official championship calendar",
  "Official event website schedule",
];

const coverageRows = [
  [2026, "minus-400-2026", "Minus 400 2026", "Israel", "completed"],
  [
    2026,
    "valleys-hard-enduro-2026",
    "Valleys Hard Enduro 2026",
    "United Kingdom",
    "completed",
  ],
  [2026, "xl-lagares-2026", "XL Lagares 2026", "Portugal", "completed"],
  [2026, "erzbergrodeo-2026", "Red Bull Erzbergrodeo 2026", "Austria", "completed"],
  [2026, "abestone-hard-enduro-2026", "Abestone Hard Enduro 2026", "Italy", "live"],
  [2026, "red-bull-romaniacs-2026", "Red Bull Romaniacs 2026", "Romania", "scheduled"],
  [2026, "xross-hard-enduro-2026", "Xross Hard Enduro 2026", "Serbia", "scheduled"],
  [2026, "red-bull-outliers-2026", "Red Bull Outliers 2026", "Canada", "scheduled"],
  [
    2026,
    "tennessee-knockout-2026",
    "Tennessee Knockout 2026",
    "United States",
    "scheduled",
  ],
  [2026, "sea-to-sky-2026", "Sea to Sky 2026", "Turkey", "scheduled"],
  [2026, "hixpania-hard-enduro-2026", "Hixpania Hard Enduro 2026", "Spain", "scheduled"],
  [2026, "getzenrodeo-2026", "GetzenRodeo 2026", "Germany", "scheduled"],
  [2026, "roof-of-africa-2026", "Roof of Africa 2026", "South Africa", "scheduled"],
  [
    2026,
    "wildwood-rock-extreme-2026",
    "Wildwood Rock Extreme 2026",
    "Australia",
    "scheduled",
  ],
  [2026, "terra-inferno-2026", "Terra Inferno 2026", "Mexico", "scheduled"],
  [2025, "minus-400-2025", "Minus 400 2025", "Israel", "completed"],
  [
    2025,
    "valleys-hard-enduro-2025",
    "Valleys Hard Enduro 2025",
    "United Kingdom",
    "completed",
  ],
  [2025, "xl-lagares-2025", "XL Lagares 2025", "Portugal", "completed"],
  [2025, "erzbergrodeo-2025", "Erzbergrodeo 2025", "Austria", "completed"],
  [2025, "red-bull-romaniacs-2025", "Red Bull Romaniacs 2025", "Romania", "completed"],
  [2025, "abestone-hard-enduro-2025", "Abestone Hard Enduro 2025", "Italy", "completed"],
  [2025, "xross-hard-enduro-2025", "Xross Hard Enduro 2025", "Serbia", "completed"],
  [2025, "red-bull-outliers-2025", "Red Bull Outliers 2025", "Canada", "completed"],
  [
    2025,
    "tennessee-knockout-2025",
    "Tennessee Knockout 2025",
    "United States",
    "completed",
  ],
  [2025, "sea-to-sky-2025", "Sea to Sky 2025", "Turkey", "completed"],
  [2025, "hixpania-hard-enduro-2025", "Hixpania Hard Enduro 2025", "Spain", "completed"],
  [2025, "getzenrodeo-2025", "GetzenRodeo 2025", "Germany", "completed"],
  [2025, "roof-of-africa-2025", "Roof of Africa 2025", "South Africa", "completed"],
  [2025, "battle-of-vikings-2025", "Battle of Vikings 2025", "Sweden", "completed"],
  [
    2025,
    "king-of-the-motos-2025",
    "King of the Motos 2025",
    "United States",
    "completed",
  ],
  [2024, "minus-400-2024", "Minus 400 2024", "Israel", "completed"],
  [
    2024,
    "valleys-hard-enduro-2024",
    "Valleys Hard Enduro 2024",
    "United Kingdom",
    "completed",
  ],
  [2024, "xl-lagares-2024", "XL Lagares 2024", "Portugal", "completed"],
  [2024, "erzbergrodeo-2024", "Erzbergrodeo 2024", "Austria", "completed"],
  [2024, "red-bull-romaniacs-2024", "Red Bull Romaniacs 2024", "Romania", "completed"],
  [2024, "abestone-hard-enduro-2024", "Abestone Hard Enduro 2024", "Italy", "completed"],
  [2024, "xross-hard-enduro-2024", "Xross Hard Enduro 2024", "Serbia", "completed"],
  [
    2024,
    "tennessee-knockout-2024",
    "Tennessee Knockout 2024",
    "United States",
    "completed",
  ],
  [2024, "hixpania-hard-enduro-2024", "Hixpania Hard Enduro 2024", "Spain", "completed"],
  [2024, "sea-to-sky-2024", "Sea to Sky 2024", "Turkey", "completed"],
  [2024, "getzenrodeo-2024", "GetzenRodeo 2024", "Germany", "completed"],
  [2024, "roof-of-africa-2024", "Roof of Africa 2024", "South Africa", "completed"],
  [
    2024,
    "wildwood-rock-extreme-2024",
    "Wildwood Rock Extreme 2024",
    "Australia",
    "completed",
  ],
  [2023, "xl-lagares-2023", "XL Lagares 2023", "Portugal", "completed"],
  [2023, "alestrem-2023", "Alestrem 2023", "France", "completed"],
  [2023, "erzbergrodeo-2023", "Erzbergrodeo 2023", "Austria", "completed"],
  [2023, "red-bull-romaniacs-2023", "Red Bull Romaniacs 2023", "Romania", "completed"],
  [2023, "sea-to-sky-2023", "Sea to Sky 2023", "Turkey", "completed"],
  [2023, "hixpania-hard-enduro-2023", "Hixpania Hard Enduro 2023", "Spain", "completed"],
  [2023, "getzenrodeo-2023", "GetzenRodeo 2023", "Germany", "completed"],
  [2023, "roof-of-africa-2023", "Roof of Africa 2023", "South Africa", "completed"],
  [2023, "battle-of-vikings-2023", "Battle of Vikings 2023", "Sweden", "completed"],
  [
    2023,
    "carpathian-hard-enduro-2023",
    "Carpathian Hard Enduro 2023",
    "Romania",
    "completed",
  ],
  [2022, "alestrem-2022", "Alestrem 2022", "France", "completed"],
  [2022, "xl-lagares-2022", "XL Lagares 2022", "Portugal", "completed"],
  [2022, "erzbergrodeo-2022", "Erzbergrodeo 2022", "Austria", "completed"],
  [2022, "red-bull-romaniacs-2022", "Red Bull Romaniacs 2022", "Romania", "completed"],
  [2022, "sea-to-sky-2022", "Sea to Sky 2022", "Turkey", "completed"],
  [2022, "hixpania-hard-enduro-2022", "Hixpania Hard Enduro 2022", "Spain", "completed"],
  [2022, "getzenrodeo-2022", "GetzenRodeo 2022", "Germany", "completed"],
  [2022, "roof-of-africa-2022", "Roof of Africa 2022", "South Africa", "completed"],
  [2022, "slovak-hard-enduro-2022", "Slovak Hard Enduro 2022", "Slovakia", "completed"],
  [2022, "hellas-extreme-2022", "Hellas Extreme 2022", "Greece", "completed"],
] as const;

export const verifiedCoverageMatrix: VerifiedEventCoverage[] = coverageRows.map(
  ([season, eventSlug, eventName, country, status], index) => {
    const hasVerifiedOverall = eventSlug === "erzbergrodeo-2026";
    const isScheduled = status === "scheduled";

    return {
      season,
      eventSlug,
      eventName,
      country,
      status,
      hasEventMetadata: true,
      hasOverallResults: hasVerifiedOverall,
      hasStageResults: false,
      hasStandingsImpact: false,
      hasSourceLinks: hasVerifiedOverall,
      confidence: hasVerifiedOverall
        ? "partial"
        : isScheduled
          ? "scheduled"
          : "source-needed",
      neededResultTypes: isScheduled ? [] : defaultNeededResultTypes,
      requiredSources: isScheduled ? scheduledSources : officialResultSources,
      priority: index + 1,
      notes: hasVerifiedOverall
        ? "First-pass verified podium and finisher count exist. Full timing, points, and full finisher list still need official source verification."
        : isScheduled
          ? "Keep metadata and schedule only until the event is complete and official classifications are available."
          : "Metadata exists, but verified overall results, stage results, standings impact, finishers, DNS/DNF/DSQ, and points still need source-backed review.",
    };
  },
);

export function getVerifiedCoverageSummary(): VerifiedCoverageSummary {
  const targetSeasons = new Set(verifiedCoverageMatrix.map((row) => row.season));
  const completedRows = verifiedCoverageMatrix.filter(
    (row) => row.status !== "scheduled",
  );
  const confidenceDistribution = verifiedCoverageMatrix.reduce<
    VerifiedCoverageSummary["confidenceDistribution"]
  >(
    (acc, row) => {
      acc[row.confidence] += 1;
      return acc;
    },
    {
      verified: 0,
      "source-needed": 0,
      partial: 0,
      scheduled: 0,
    },
  );
  const nextRecommendedTargets = completedRows
    .filter(
      (row) => !row.hasOverallResults || !row.hasStageResults || !row.hasSourceLinks,
    )
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 8)
    .map((row) => ({
      season: row.season,
      eventSlug: row.eventSlug,
      eventName: row.eventName,
      missing: [
        !row.hasOverallResults ? "overall results" : null,
        !row.hasStageResults ? "stage results" : null,
        !row.hasSourceLinks ? "source links" : null,
      ].filter((item) => item !== null),
      priority: row.priority,
    }));

  return {
    totalTargetSeasons: targetSeasons.size,
    totalTargetEvents: verifiedCoverageMatrix.length,
    verifiedEvents: verifiedCoverageMatrix.filter((row) => row.hasOverallResults).length,
    missingOverallResults: completedRows.filter((row) => !row.hasOverallResults).length,
    missingStageResults: completedRows.filter((row) => !row.hasStageResults).length,
    missingSourceLinks: completedRows.filter((row) => !row.hasSourceLinks).length,
    sourceCoverage: {
      withSourceLinks: verifiedCoverageMatrix.filter((row) => row.hasSourceLinks).length,
      withoutSourceLinks: verifiedCoverageMatrix.filter((row) => !row.hasSourceLinks)
        .length,
    },
    registryCoverage: {
      configuredSources: officialSourceRegistry.length,
      primarySources: officialSourceRegistry.filter(
        (source) => source.trustLevel === "primary",
      ).length,
      mediaOnlySources: officialSourceRegistry.filter(
        (source) => source.trustLevel === "media-only",
      ).length,
    },
    unsupportedSourceWarnings: officialSourceRegistry
      .filter((source) => source.trustLevel === "media-only")
      .flatMap((source) =>
        source.allowedDataTypes.some((dataType) => dataType !== "media")
          ? [`${source.id} is media-only but allows non-media data.`]
          : [],
      ),
    confidenceDistribution,
    nextRecommendedTargets,
  };
}
