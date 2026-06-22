import type {
  NormalizedOfficialResult,
  RawOfficialResult,
} from "@/jobs/connectors/results/types";

export function normalizeOfficialResult(
  result: RawOfficialResult,
): NormalizedOfficialResult {
  return {
    externalId: result.externalId,
    existingResultId: result.existingResultId ?? null,
    event: result.event.trim(),
    stage: result.stage.trim(),
    rider: result.rider.trim(),
    country: result.country.trim(),
    team: result.team.trim(),
    manufacturer: result.manufacturer.trim(),
    motorcycle: result.motorcycle.trim(),
    position: result.position,
    time: result.time,
    gapToLeader: result.gapToLeader,
    gapToPrevious: result.gapToPrevious,
    penalties: result.penalties,
    points: result.points,
    status: result.status,
    officialSourceUrl: result.officialSourceUrl,
  };
}
