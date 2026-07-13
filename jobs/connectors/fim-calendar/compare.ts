import { normalizeName } from "@/lib/source-intelligence";
import { normalizeSlug, resolveExplicitEventAlias, sponsorlessEventKey } from "./aliases";
import type {
  FimCalendarChangeType,
  FimCalendarCurrentEvent,
  FimCalendarInputCoverageMode,
  FimCalendarMatch,
  FimCalendarReportRow,
  NormalizedFimCalendarEventCandidate,
} from "./types";

export function compareFimCalendarCandidates({
  candidates,
  currentEvents,
  coverageMode,
  selectedEventSlug = null,
}: {
  candidates: NormalizedFimCalendarEventCandidate[];
  currentEvents: FimCalendarCurrentEvent[];
  coverageMode: FimCalendarInputCoverageMode;
  selectedEventSlug?: string | null;
}): FimCalendarReportRow[] {
  const sourceRows = candidates.flatMap((candidate) =>
    createRowsForCandidate(candidate, findEventMatch(candidate, currentEvents)),
  );
  const missingRows =
    coverageMode === "full-season"
      ? findMissingFromSource(currentEvents, candidates).map(
          (event): FimCalendarReportRow => ({
            eventName: event.name,
            currentValue: eventToRecord(event),
            proposedValue: null,
            changeType: "missing-from-source",
            confidence: {
              level: "manual-review",
              score: 0.55,
              reason:
                "Existing database event was not present in the dry-run source input.",
            },
            severity: "review-required",
            reviewRecommendation:
              "Review manually before changing public calendar visibility or status.",
            sourceUrl: event.officialUrl,
            matchingStrategy: "unmatched",
            matchingConfidence: 0.35,
            ambiguousReason: null,
          }),
        )
      : createPartialCoverageRows({
          currentEvents,
          candidates,
          coverageMode,
          selectedEventSlug,
        });

  return [...sourceRows, ...missingRows];
}

export function findEventMatch(
  candidate: NormalizedFimCalendarEventCandidate,
  currentEvents: FimCalendarCurrentEvent[],
): FimCalendarMatch {
  if (candidate.sourceEventId) {
    const sourceMatches = currentEvents.filter(
      (event) => event.sourceEventId === candidate.sourceEventId,
    );
    if (sourceMatches.length === 1) {
      return {
        status: "matched",
        event: sourceMatches[0],
        strategy: "sourceEventId",
        confidence: 0.99,
        reason: "Stored official source event id matched.",
      };
    }
    if (sourceMatches.length > 1) {
      return {
        status: "ambiguous",
        events: sourceMatches,
        strategy: "sourceEventId",
        confidence: 0.4,
        reason: "Multiple current events share the same official source event id.",
      };
    }
  }

  const aliasMatches = findAliasMatches(candidate, currentEvents);
  if (aliasMatches.length === 1) {
    return {
      status: "matched",
      event: aliasMatches[0],
      strategy: "explicit-alias",
      confidence: 0.96,
      reason: "Explicit event alias matched canonical event identity.",
    };
  }
  if (aliasMatches.length > 1) {
    return {
      status: "ambiguous",
      events: aliasMatches,
      strategy: "explicit-alias",
      confidence: 0.45,
      reason: "Explicit event alias matched multiple current events.",
    };
  }

  const slugMatches = currentEvents.filter(
    (event) => normalizeSlug(event.slug) === normalizeSlug(candidate.slugCandidate),
  );
  if (slugMatches.length === 1) {
    return {
      status: "matched",
      event: slugMatches[0],
      strategy: "exact-normalized-slug",
      confidence: 0.94,
      reason: "Exact normalized slug matched.",
    };
  }
  if (slugMatches.length > 1) {
    return {
      status: "ambiguous",
      events: slugMatches,
      strategy: "exact-normalized-slug",
      confidence: 0.45,
      reason: "Normalized slug matched multiple current events.",
    };
  }

  const sponsorlessMatches = currentEvents.filter(
    (event) =>
      event.seasonYear === candidate.seasonYear &&
      sponsorlessEventKey(event.name, event.seasonYear) ===
        sponsorlessEventKey(candidate.eventName, candidate.seasonYear),
  );
  if (sponsorlessMatches.length === 1) {
    return {
      status: "matched",
      event: sponsorlessMatches[0],
      strategy: "sponsorless-name-season",
      confidence: 0.82,
      reason:
        "Normalized event name matched after sponsor words and season year were removed.",
    };
  }
  if (sponsorlessMatches.length > 1) {
    return {
      status: "ambiguous",
      events: sponsorlessMatches,
      strategy: "sponsorless-name-season",
      confidence: 0.4,
      reason: "Sponsorless normalized event name matched multiple current events.",
    };
  }

  const countryLocationDateMatches = currentEvents.filter((event) =>
    hasCountryLocationDateMatch(event, candidate),
  );
  if (countryLocationDateMatches.length === 1) {
    return {
      status: "matched",
      event: countryLocationDateMatches[0],
      strategy: "country-location-overlapping-dates",
      confidence: 0.74,
      reason: "Country, location, and date range overlap matched.",
    };
  }
  if (countryLocationDateMatches.length > 1) {
    return {
      status: "ambiguous",
      events: countryLocationDateMatches,
      strategy: "country-location-overlapping-dates",
      confidence: 0.35,
      reason: "Country, location, and overlapping dates matched multiple current events.",
    };
  }

  return {
    status: "not-found",
    strategy: "unmatched",
    confidence: 0,
    reason: "No reliable event match found.",
  };
}

function createRowsForCandidate(
  candidate: NormalizedFimCalendarEventCandidate,
  match: FimCalendarMatch,
): FimCalendarReportRow[] {
  if (match.status === "ambiguous") {
    return [
      {
        eventName: candidate.eventName,
        currentValue: {
          matchedEventIds: match.events.map((event) => event.id),
          strategy: match.strategy,
          reason: match.reason,
        },
        proposedValue: candidateToRecord(candidate),
        changeType: "ambiguous-match-requires-review",
        confidence: {
          ...candidate.confidence,
          score: Math.min(candidate.confidence.score, 0.45),
          reason: "Multiple current events matched the same calendar candidate.",
        },
        severity: "review-required",
        reviewRecommendation:
          "Resolve the event identity manually before accepting this calendar candidate.",
        sourceUrl: candidate.officialUrl,
        matchingStrategy: match.strategy,
        matchingConfidence: match.confidence,
        ambiguousReason: match.reason,
      },
    ];
  }

  if (match.status === "not-found") {
    return [
      {
        eventName: candidate.eventName,
        currentValue: null,
        proposedValue: candidateToRecord(candidate),
        changeType: "new-event-found",
        confidence: candidate.confidence,
        severity: "review-required",
        reviewRecommendation:
          "Review as a new event candidate. Do not publish without approval.",
        sourceUrl: candidate.officialUrl,
        matchingStrategy: match.strategy,
        matchingConfidence: match.confidence,
        ambiguousReason: null,
      },
    ];
  }

  const changes = detectFieldChanges(match.event, candidate);
  if (changes.length === 0) {
    return [
      {
        eventName: candidate.eventName,
        currentValue: eventToRecord(match.event),
        proposedValue: candidateToRecord(candidate),
        changeType: "existing-event-unchanged",
        confidence: candidate.confidence,
        severity: "info",
        reviewRecommendation: "No public change recommended.",
        sourceUrl: candidate.officialUrl,
        matchingStrategy: match.strategy,
        matchingConfidence: match.confidence,
        ambiguousReason: null,
      },
    ];
  }

  return changes.map((changeType) => ({
    eventName: candidate.eventName,
    currentValue: eventToRecord(match.event),
    proposedValue: candidateToRecord(candidate),
    changeType,
    confidence: candidate.confidence,
    severity: "review-required",
    reviewRecommendation:
      "Review the proposed calendar change before any database update or public status change.",
    sourceUrl: candidate.officialUrl,
    matchingStrategy: match.strategy,
    matchingConfidence: match.confidence,
    ambiguousReason: null,
  }));
}

function detectFieldChanges(
  event: FimCalendarCurrentEvent,
  candidate: NormalizedFimCalendarEventCandidate,
): FimCalendarChangeType[] {
  const changes: FimCalendarChangeType[] = [];

  if (!calendarDatesEqual(event.startDate, candidate.startDate)) {
    changes.push("date-changed");
  }
  if (
    calendarDatesEqual(event.startDate, candidate.startDate) &&
    !timesEqualWhenExact(
      event.startDate,
      candidate.startDate,
      candidate.startDatePrecision,
    )
  ) {
    changes.push("time-changed");
  }
  if (!calendarDatesEqual(event.endDate, candidate.endDate)) {
    changes.push("date-changed");
  }
  if (
    calendarDatesEqual(event.endDate, candidate.endDate) &&
    !timesEqualWhenExact(event.endDate, candidate.endDate, candidate.endDatePrecision)
  ) {
    changes.push("time-changed");
  }
  if (normalizeNullable(event.country) !== normalizeNullable(candidate.country)) {
    changes.push("country-changed");
  }
  if (normalizeNullable(event.location) !== normalizeNullable(candidate.location)) {
    changes.push("location-changed");
  }
  if (
    normalizeStatusValue(event.status) !==
    normalizeStatusValue(candidate.raceStatusCandidate)
  ) {
    changes.push("status-changed");
  }
  if (normalizeNullable(event.officialUrl) !== normalizeNullable(candidate.officialUrl)) {
    changes.push("official-url-changed");
  }

  return changes;
}

function createPartialCoverageRows({
  currentEvents,
  candidates,
  coverageMode,
  selectedEventSlug,
}: {
  currentEvents: FimCalendarCurrentEvent[];
  candidates: NormalizedFimCalendarEventCandidate[];
  coverageMode: FimCalendarInputCoverageMode;
  selectedEventSlug: string | null;
}) {
  if (coverageMode === "single-event" && selectedEventSlug) {
    return findMissingFromSource(
      currentEvents.filter((event) => event.slug === selectedEventSlug),
      candidates,
    ).map(
      (event): FimCalendarReportRow => ({
        eventName: event.name,
        currentValue: eventToRecord(event),
        proposedValue: null,
        changeType: "not-evaluated-partial-input",
        confidence: {
          level: "manual-review",
          score: 0.25,
          reason: "Single-event input does not prove the event is missing from source.",
        },
        severity: "warning",
        reviewRecommendation:
          "No removal or public status action recommended from single-event input.",
        sourceUrl: event.officialUrl,
        matchingStrategy: "unmatched",
        matchingConfidence: 0.25,
        ambiguousReason: null,
      }),
    );
  }

  return currentEvents.length > candidates.length
    ? [
        {
          eventName: "Partial calendar input",
          currentValue: { currentEventCount: currentEvents.length },
          proposedValue: { sourceCandidateCount: candidates.length },
          changeType: "not-evaluated-partial-input" as const,
          confidence: {
            level: "manual-review" as const,
            score: 0.25,
            reason:
              "Partial source input cannot prove unrelated database events are missing.",
          },
          severity: "info" as const,
          reviewRecommendation:
            "Use a full-season official input before evaluating missing events.",
          sourceUrl: null,
          matchingStrategy: "unmatched" as const,
          matchingConfidence: 0.25,
          ambiguousReason: null,
        },
      ]
    : [];
}

function findMissingFromSource(
  currentEvents: FimCalendarCurrentEvent[],
  candidates: NormalizedFimCalendarEventCandidate[],
) {
  const matchedEventIds = new Set(
    candidates
      .map((candidate) => findEventMatch(candidate, currentEvents))
      .filter(
        (match): match is Extract<FimCalendarMatch, { status: "matched" }> =>
          match.status === "matched",
      )
      .map((match) => match.event.id),
  );

  return currentEvents.filter((event) => !matchedEventIds.has(event.id));
}

function datesEqual(left: string | null, right: string | null) {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return new Date(left).toISOString() === new Date(right).toISOString();
}

function calendarDatesEqual(left: string | null, right: string | null) {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return toDateOnly(left) === toDateOnly(right);
}

function timesEqualWhenExact(
  left: string | null,
  right: string | null,
  precision: NormalizedFimCalendarEventCandidate["startDatePrecision"],
) {
  if (precision !== "datetime") return true;
  return datesEqual(left, right);
}

function toDateOnly(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function normalizeNullable(value: string | null) {
  return value ? normalizeName(value) : null;
}

function eventToRecord(event: FimCalendarCurrentEvent) {
  return {
    id: event.id,
    slug: event.slug,
    name: event.name,
    seasonYear: event.seasonYear,
    country: event.country,
    countryCode: event.countryCode,
    location: event.location,
    venue: event.venue,
    startDate: event.startDate,
    endDate: event.endDate,
    status: event.status,
    officialUrl: event.officialUrl,
  };
}

function candidateToRecord(candidate: NormalizedFimCalendarEventCandidate) {
  return {
    sourceEventId: candidate.sourceEventId,
    slugCandidate: candidate.slugCandidate,
    eventName: candidate.eventName,
    seasonYear: candidate.seasonYear,
    country: candidate.country,
    countryCode: candidate.countryCode,
    location: candidate.location,
    venue: candidate.venue,
    startDate: candidate.startDate,
    endDate: candidate.endDate,
    raceStatusCandidate: candidate.raceStatusCandidate,
    startDatePrecision: candidate.startDatePrecision,
    endDatePrecision: candidate.endDatePrecision,
    officialUrl: candidate.officialUrl,
  };
}

function findAliasMatches(
  candidate: NormalizedFimCalendarEventCandidate,
  currentEvents: FimCalendarCurrentEvent[],
) {
  const candidateAlias = resolveExplicitEventAlias(candidate.eventName);
  const candidateSlugAlias = resolveExplicitEventAlias(candidate.slugCandidate);

  return currentEvents.filter((event) => {
    const eventAlias = resolveExplicitEventAlias(event.name);
    const eventSlugAlias = resolveExplicitEventAlias(event.slug);
    const aliases = [candidateAlias, candidateSlugAlias].filter(Boolean);
    return aliases.some(
      (alias) => alias === eventAlias || alias === eventSlugAlias || alias === event.slug,
    );
  });
}

function hasCountryLocationDateMatch(
  event: FimCalendarCurrentEvent,
  candidate: NormalizedFimCalendarEventCandidate,
) {
  const countryMatches =
    normalizeNullable(event.countryCode) === normalizeNullable(candidate.countryCode) ||
    normalizeNullable(event.country) === normalizeNullable(candidate.country);
  const locationMatches =
    normalizeNullable(event.location) === normalizeNullable(candidate.location) ||
    normalizeNullable(event.venue) === normalizeNullable(candidate.venue);

  return countryMatches && locationMatches && dateRangesOverlap(event, candidate);
}

function dateRangesOverlap(
  event: FimCalendarCurrentEvent,
  candidate: NormalizedFimCalendarEventCandidate,
) {
  if (!event.startDate || !candidate.startDate) return false;
  const eventStart = toDateOnly(event.startDate);
  const eventEnd = event.endDate ? toDateOnly(event.endDate) : eventStart;
  const candidateStart = toDateOnly(candidate.startDate);
  const candidateEnd = candidate.endDate ? toDateOnly(candidate.endDate) : candidateStart;

  return eventStart <= candidateEnd && candidateStart <= eventEnd;
}

function normalizeStatusValue(value: string | null) {
  const normalized = normalizeNullable(value);

  if (!normalized) return null;
  if (["scheduled", "coming soon", "upcoming"].includes(normalized)) {
    return "coming-soon";
  }
  if (["live", "live now"].includes(normalized)) return "live-now";
  if (["completed", "finished", "race completed"].includes(normalized)) {
    return "race-completed";
  }
  if (normalized.includes("cancel")) return "cancelled";
  if (normalized.includes("postpone")) return "postponed";
  if (normalized.includes("suspend")) return "suspended";
  return normalized;
}
