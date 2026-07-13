import { createStableChecksum } from "./checksum";
import type {
  ActionableReviewRow,
  FimCalendarPersistenceInput,
  FimCalendarPersistenceRepository,
  FimCalendarPersistenceResult,
  FimCalendarReviewInput,
  FimCalendarSnapshotInput,
  PersistableReviewAction,
  PersistableReviewItem,
} from "./types";
import type { FimCalendarChangeType, FimCalendarReportRow } from "../types";

const connectorKey = "fim-calendar";

export async function persistFimCalendarReviewRun({
  repository,
  input,
}: {
  repository: FimCalendarPersistenceRepository;
  input: FimCalendarPersistenceInput;
}): Promise<FimCalendarPersistenceResult> {
  const normalizedPayload = input.normalizedCandidates
    .map((candidate) => ({
      sourceEventId: candidate.sourceEventId,
      seasonYear: candidate.seasonYear,
      eventName: candidate.eventName,
      slugCandidate: candidate.slugCandidate,
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
      sourceId: candidate.sourceId,
      confidence: candidate.confidence,
      reviewRequired: candidate.reviewRequired,
      notes: candidate.notes,
    }))
    .sort(compareNormalizedEvents);
  const payloadChecksum = createStableChecksum(normalizedPayload);
  const season = input.report.summary.seasonYear;
  const sourceKey = input.report.summary.sourceId;
  const actionableRows = input.report.rows
    .map((row) => toActionableReviewRow(row, season))
    .filter((row): row is ActionableReviewRow => Boolean(row));

  return repository.transaction(async (transactionRepository) => {
    const latestSnapshot = await transactionRepository.findLatestSnapshot({
      connectorKey,
      season,
    });

    if (latestSnapshot?.payloadChecksum === payloadChecksum) {
      return {
        requested: true,
        performed: true,
        snapshotStatus: "reused",
        snapshotId: latestSnapshot.id,
        snapshotChecksum: payloadChecksum,
        snapshotCreated: false,
        snapshotReused: true,
        duplicateSnapshotDetected: true,
        reviewItemsCreated: [],
        reviewItemsReused: [],
        reviewItemsSuperseded: [],
        totalPendingReviewItems: await transactionRepository.countPendingReviewItems({
          connectorKey,
          season,
        }),
        publicEventsUpdated: 0,
      };
    }

    const snapshot = await transactionRepository.createSnapshot(
      buildSnapshotInput({
        input,
        normalizedPayload,
        payloadChecksum,
        sourceKey,
      }),
    );
    const created: PersistableReviewItem[] = [];
    const reused: PersistableReviewItem[] = [];
    const superseded: PersistableReviewItem[] = [];

    for (const actionable of actionableRows) {
      const pendingSameChange =
        await transactionRepository.findPendingReviewItemByDeduplicationKey(
          actionable.input.deduplicationKey,
        );

      if (pendingSameChange) {
        reused.push(
          await transactionRepository.updateReviewItemSnapshot({
            id: pendingSameChange.id,
            snapshotId: snapshot.id,
          }),
        );
        continue;
      }

      const pendingForSameEvent =
        await transactionRepository.findPendingReviewItemsForEvent({
          connectorKey,
          season,
          sourceEventId: actionable.input.sourceEventId,
          currentEventId: actionable.input.currentEventId,
          suggestedAction: actionable.input.suggestedAction,
        });

      for (const item of pendingForSameEvent) {
        superseded.push(await transactionRepository.supersedeReviewItem(item.id));
      }

      created.push(
        await transactionRepository.createReviewItem({
          snapshotId: snapshot.id,
          input: actionable.input,
        }),
      );
    }

    return {
      requested: true,
      performed: true,
      snapshotStatus: "created",
      snapshotId: snapshot.id,
      snapshotChecksum: payloadChecksum,
      snapshotCreated: true,
      snapshotReused: false,
      duplicateSnapshotDetected: false,
      reviewItemsCreated: created,
      reviewItemsReused: reused,
      reviewItemsSuperseded: superseded,
      totalPendingReviewItems: await transactionRepository.countPendingReviewItems({
        connectorKey,
        season,
      }),
      publicEventsUpdated: 0,
    };
  });
}

export function createNoPersistenceResult(
  requested = false,
): FimCalendarPersistenceResult {
  return {
    requested,
    performed: false,
    snapshotStatus: requested ? "failed" : "not-requested",
    snapshotId: null,
    snapshotChecksum: null,
    snapshotCreated: false,
    snapshotReused: false,
    duplicateSnapshotDetected: false,
    reviewItemsCreated: [],
    reviewItemsReused: [],
    reviewItemsSuperseded: [],
    totalPendingReviewItems: 0,
    publicEventsUpdated: 0,
  };
}

export function createFailedPersistenceResult(
  errorMessage: string,
): FimCalendarPersistenceResult {
  return {
    ...createNoPersistenceResult(true),
    errorMessage,
  };
}

export function toActionableReviewRow(
  row: FimCalendarReportRow,
  season: number,
): ActionableReviewRow | null {
  const suggestedAction = toSuggestedAction(row.changeType);
  if (!suggestedAction) return null;

  const changedFields = inferChangedFields(row.changeType);
  const reviewInput: FimCalendarReviewInput = {
    connectorKey,
    season,
    sourceEventId: stringValue(row.proposedValue?.sourceEventId),
    currentEventId: stringValue(row.currentValue?.id),
    eventName: row.eventName,
    suggestedAction,
    confidence: row.confidence,
    matchingStrategy: row.matchingStrategy,
    ambiguityReason: row.ambiguousReason ?? null,
    currentValues: row.currentValue,
    proposedValues: row.proposedValue,
    changedFields,
    recommendation: row.reviewRecommendation,
    deduplicationKey: createStableChecksum({
      connectorKey,
      season,
      identity: row.proposedValue?.sourceEventId ?? row.currentValue?.id ?? row.eventName,
      suggestedAction,
      currentValues: row.currentValue,
      proposedValues: row.proposedValue,
      changedFields,
    }),
  };

  return { row, input: reviewInput };
}

function buildSnapshotInput({
  input,
  normalizedPayload,
  payloadChecksum,
  sourceKey,
}: {
  input: FimCalendarPersistenceInput;
  normalizedPayload: unknown;
  payloadChecksum: string;
  sourceKey: string;
}): FimCalendarSnapshotInput {
  const diagnostics = input.report.metadata.diagnostics;

  return {
    connectorKey,
    sourceKey,
    season: input.report.summary.seasonYear,
    coverageMode: input.report.metadata.inputCoverageMode,
    inputSourceType: input.report.metadata.inputSourceType,
    requestedSourceUrl: diagnostics.requestedOfficialUrl,
    finalResponseUrl: diagnostics.finalResponseUrl,
    httpStatus: diagnostics.httpStatus,
    contentType: diagnostics.contentType,
    parserSelected: diagnostics.parserSelected,
    rawRecordCount: diagnostics.rawRecordsDetected,
    usableEventCount: diagnostics.usableEventsParsed,
    rejectedRecordCount: diagnostics.recordsRejected,
    rejectionReasons: diagnostics.rejectionReasons,
    fetchDurationMs: null,
    executionDurationMs: input.finishedAt.getTime() - input.startedAt.getTime(),
    fallbackUsed: diagnostics.fallbackUsed,
    environment: input.environment ?? null,
    gitCommitSha: input.gitCommitSha ?? null,
    connectorVersion: input.connectorVersion ?? null,
    normalizedPayload,
    matchingPayload: input.report.rows,
    diagnostics,
    payloadChecksum,
  };
}

function toSuggestedAction(
  changeType: FimCalendarChangeType,
): PersistableReviewAction | null {
  if (changeType === "new-event-found") return "NEW_EVENT";
  if (changeType === "missing-from-source") return "SOURCE_REMOVED";
  if (changeType === "ambiguous-match-requires-review") return "MANUAL_REVIEW";
  if (changeType.endsWith("-changed")) return "UPDATE_EVENT";
  return null;
}

function inferChangedFields(changeType: FimCalendarChangeType) {
  if (changeType === "date-changed") return ["startDate", "endDate"];
  if (changeType === "time-changed") return ["startDate", "endDate"];
  if (changeType === "country-changed") return ["country", "countryCode"];
  if (changeType === "location-changed") return ["location", "venue"];
  if (changeType === "status-changed") return ["status"];
  if (changeType === "official-url-changed") return ["officialUrl"];
  if (changeType === "new-event-found") return ["event"];
  if (changeType === "missing-from-source") return ["event"];
  if (changeType === "ambiguous-match-requires-review") return ["identity"];
  return [];
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function compareNormalizedEvents(
  left: { sourceEventId: string | null; eventName: string; startDate: string | null },
  right: { sourceEventId: string | null; eventName: string; startDate: string | null },
) {
  const leftKey = [left.sourceEventId ?? "", left.startDate ?? "", left.eventName].join(
    "|",
  );
  const rightKey = [
    right.sourceEventId ?? "",
    right.startDate ?? "",
    right.eventName,
  ].join("|");

  return leftKey.localeCompare(rightKey);
}
