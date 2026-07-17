import { allocatePoints } from "@/jobs/calculations/points-system";
import type { CalculationResultInput } from "@/jobs/calculations/validation";
import type { TieBreakRule } from "@/lib/regulations/championship-regulations";

export type SeasonStandingPreview = {
  seasonId: string;
  riderId: string;
  riderName: string;
  className: string | null;
  proposedPosition: number | null;
  proposedPoints: number;
  wins: number;
  podiums: number;
  starts: number;
  dnfs: number;
  seconds: number;
  tieBreakResolved: boolean;
};

export type TieBreakRulesByScope = Record<string, TieBreakRule[]>;

type InternalStandingPreview = SeasonStandingPreview & {
  resultHistory: CalculationResultInput[];
};

export function calculateSeasonRankingPreview(
  results: CalculationResultInput[],
  tieBreakRulesByScope: TieBreakRulesByScope = {},
): SeasonStandingPreview[] {
  const rows = new Map<string, InternalStandingPreview>();

  for (const result of results) {
    if (!result.riderId) {
      continue;
    }

    const key = `${result.seasonId}:${result.riderId}:${result.className ?? "__NULL__"}`;
    const existing = rows.get(key) ?? {
      seasonId: result.seasonId,
      riderId: result.riderId,
      riderName: result.riderName,
      className: result.className,
      proposedPosition: 0,
      proposedPoints: 0,
      wins: 0,
      podiums: 0,
      starts: 0,
      dnfs: 0,
      seconds: 0,
      tieBreakResolved: true,
      resultHistory: [],
    };

    existing.resultHistory.push(result);
    existing.starts += result.status === "DNS" ? 0 : 1;
    existing.dnfs += result.status === "DNF" ? 1 : 0;
    existing.wins += result.position === 1 && result.status === "FINISHED" ? 1 : 0;
    existing.seconds += result.position === 2 && result.status === "FINISHED" ? 1 : 0;
    existing.podiums +=
      result.position !== null && result.position <= 3 && result.status === "FINISHED"
        ? 1
        : 0;
    existing.proposedPoints += allocatePoints(result.points, result.status);

    rows.set(key, existing);
  }

  const sorted = Array.from(rows.values()).sort((a, b) => {
    const scopeCompare =
      a.seasonId.localeCompare(b.seasonId) ||
      (a.className ?? "").localeCompare(b.className ?? "");
    if (scopeCompare !== 0) return scopeCompare;
    const pointsCompare = b.proposedPoints - a.proposedPoints;
    if (pointsCompare !== 0) return pointsCompare;
    const tie = compareByOfficialTieBreaks(
      a,
      b,
      tieBreakRulesByScope[scopeKey(a.seasonId, a.className)] ?? [],
    );
    return tie.result;
  });
  const scopeCounts = new Map<string, number>();
  return sorted.map((row, index, orderedRows) => {
    const scope = `${row.seasonId}:${row.className ?? "__NULL__"}`;
    const position = (scopeCounts.get(scope) ?? 0) + 1;
    scopeCounts.set(scope, position);
    const unresolvedWithPrevious =
      index > 0 &&
      isUnresolvedTie(
        orderedRows[index - 1],
        row,
        tieBreakRulesByScope[scopeKey(row.seasonId, row.className)] ?? [],
      );
    const unresolvedWithNext =
      index < orderedRows.length - 1 &&
      isUnresolvedTie(
        row,
        orderedRows[index + 1],
        tieBreakRulesByScope[scopeKey(row.seasonId, row.className)] ?? [],
      );
    return {
      seasonId: row.seasonId,
      riderId: row.riderId,
      riderName: row.riderName,
      className: row.className,
      proposedPosition: position,
      proposedPoints: row.proposedPoints,
      wins: row.wins,
      podiums: row.podiums,
      starts: row.starts,
      dnfs: row.dnfs,
      seconds: row.seconds,
      tieBreakResolved: !(unresolvedWithPrevious || unresolvedWithNext),
    };
  });
}

export function scopeKey(seasonId: string, className: string | null) {
  return `${seasonId}:${className ?? "__NULL__"}`;
}

function isUnresolvedTie(
  left: InternalStandingPreview,
  right: InternalStandingPreview,
  rules: TieBreakRule[],
) {
  return (
    left.seasonId === right.seasonId &&
    (left.className ?? null) === (right.className ?? null) &&
    left.proposedPoints === right.proposedPoints &&
    compareByOfficialTieBreaks(left, right, rules).resolved === false
  );
}

function compareByOfficialTieBreaks(
  left: InternalStandingPreview,
  right: InternalStandingPreview,
  rules: TieBreakRule[],
) {
  if (left.proposedPoints !== right.proposedPoints) {
    return { result: right.proposedPoints - left.proposedPoints, resolved: true };
  }
  for (const rule of [...rules].sort((a, b) => a.order - b.order)) {
    if (rule.type === "wins" && left.wins !== right.wins) {
      return { result: right.wins - left.wins, resolved: true };
    }
    if (rule.type === "second-places" && left.seconds !== right.seconds) {
      return { result: right.seconds - left.seconds, resolved: true };
    }
    if (rule.type === "majority-placing-vector") {
      const result = comparePlacingVector(left, right);
      if (result !== 0) return { result, resolved: true };
    }
    if (rule.type === "best-recent-finish") {
      const result = compareBestRecentFinish(left, right);
      if (result !== 0) return { result, resolved: true };
    }
    if (rule.type === "last-race") {
      const result = compareBestRecentFinish(left, right);
      if (result !== 0) return { result, resolved: true };
    }
  }
  return { result: 0, resolved: false };
}

function comparePlacingVector(
  left: InternalStandingPreview,
  right: InternalStandingPreview,
) {
  const maxPosition = Math.max(
    ...[...left.resultHistory, ...right.resultHistory]
      .map((result) =>
        result.status === "FINISHED" && result.position !== null ? result.position : 0,
      )
      .filter((position) => position > 0),
    0,
  );
  for (let position = 1; position <= maxPosition; position += 1) {
    const leftCount = countFinishedPosition(left, position);
    const rightCount = countFinishedPosition(right, position);
    if (leftCount !== rightCount) return rightCount - leftCount;
  }
  return 0;
}

function countFinishedPosition(row: InternalStandingPreview, position: number) {
  return row.resultHistory.filter(
    (result) => result.status === "FINISHED" && result.position === position,
  ).length;
}

function compareBestRecentFinish(
  left: InternalStandingPreview,
  right: InternalStandingPreview,
) {
  const events = new Map<
    string,
    { roundNumber: number | null; startDate: string | null }
  >();
  for (const result of [...left.resultHistory, ...right.resultHistory]) {
    events.set(result.eventId, {
      roundNumber: result.eventRoundNumber ?? null,
      startDate: result.eventStartDate ?? null,
    });
  }
  const orderedEvents = Array.from(events.entries()).sort((a, b) => {
    const [, metaA] = a;
    const [, metaB] = b;
    if (metaA.roundNumber !== null && metaB.roundNumber !== null) {
      return metaB.roundNumber - metaA.roundNumber;
    }
    if (metaA.roundNumber !== null) return -1;
    if (metaB.roundNumber !== null) return 1;
    return (metaB.startDate ?? "").localeCompare(metaA.startDate ?? "");
  });
  for (const [eventId] of orderedEvents) {
    const leftRank = resultRankForEvent(left, eventId);
    const rightRank = resultRankForEvent(right, eventId);
    if (leftRank !== rightRank) return leftRank - rightRank;
  }
  return 0;
}

function resultRankForEvent(row: InternalStandingPreview, eventId: string) {
  const result = row.resultHistory.find((entry) => entry.eventId === eventId);
  if (!result) return 100_000;
  if (result.status === "FINISHED" && result.position !== null) return result.position;
  if (result.status === "DNF") return 90_001;
  if (result.status === "DNS") return 90_002;
  if (result.status === "DSQ") return 90_003;
  return 90_004;
}
