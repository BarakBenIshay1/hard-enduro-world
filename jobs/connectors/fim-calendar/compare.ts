import { normalizeName } from "@/lib/source-intelligence";
import type {
  FimCalendarChangeType,
  FimCalendarCurrentEvent,
  FimCalendarMatch,
  FimCalendarReportRow,
  NormalizedFimCalendarEventCandidate,
} from "./types";

export function compareFimCalendarCandidates({
  candidates,
  currentEvents,
}: {
  candidates: NormalizedFimCalendarEventCandidate[];
  currentEvents: FimCalendarCurrentEvent[];
}): FimCalendarReportRow[] {
  const sourceRows = candidates.flatMap((candidate) =>
    createRowsForCandidate(candidate, findEventMatch(candidate, currentEvents)),
  );
  const missingRows = findMissingFromSource(currentEvents, candidates).map(
    (event): FimCalendarReportRow => ({
      eventName: event.name,
      currentValue: eventToRecord(event),
      proposedValue: null,
      changeType: "missing-from-source",
      confidence: {
        level: "manual-review",
        score: 0.55,
        reason: "Existing database event was not present in the dry-run source input.",
      },
      severity: "review-required",
      reviewRecommendation:
        "Review manually before changing public calendar visibility or status.",
      sourceUrl: event.officialUrl,
    }),
  );

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
      return { status: "matched", event: sourceMatches[0], strategy: "sourceEventId" };
    }
    if (sourceMatches.length > 1) {
      return { status: "ambiguous", events: sourceMatches, strategy: "sourceEventId" };
    }
  }

  const slugMatches = currentEvents.filter(
    (event) => event.slug === candidate.slugCandidate,
  );
  if (slugMatches.length === 1) {
    return { status: "matched", event: slugMatches[0], strategy: "slugCandidate" };
  }
  if (slugMatches.length > 1) {
    return { status: "ambiguous", events: slugMatches, strategy: "slugCandidate" };
  }

  const nameSeasonMatches = currentEvents.filter(
    (event) =>
      event.seasonYear === candidate.seasonYear &&
      normalizeName(event.name) === normalizeName(candidate.eventName),
  );
  if (nameSeasonMatches.length === 1) {
    return {
      status: "matched",
      event: nameSeasonMatches[0],
      strategy: "name-season",
    };
  }
  if (nameSeasonMatches.length > 1) {
    return {
      status: "ambiguous",
      events: nameSeasonMatches,
      strategy: "name-season",
    };
  }

  return { status: "not-found", strategy: "name-season" };
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
  }));
}

function detectFieldChanges(
  event: FimCalendarCurrentEvent,
  candidate: NormalizedFimCalendarEventCandidate,
): FimCalendarChangeType[] {
  const changes: FimCalendarChangeType[] = [];

  if (
    !datesEqual(event.startDate, candidate.startDate) ||
    !datesEqual(event.endDate, candidate.endDate)
  ) {
    changes.push("date-changed");
  }
  if (normalizeNullable(event.country) !== normalizeNullable(candidate.country)) {
    changes.push("country-changed");
  }
  if (normalizeNullable(event.location) !== normalizeNullable(candidate.location)) {
    changes.push("location-changed");
  }
  if (
    normalizeNullable(event.status) !== normalizeNullable(candidate.raceStatusCandidate)
  ) {
    changes.push("status-changed");
  }
  if (normalizeNullable(event.officialUrl) !== normalizeNullable(candidate.officialUrl)) {
    changes.push("official-url-changed");
  }

  return changes;
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
    officialUrl: candidate.officialUrl,
  };
}
