import { Prisma, type ResultPointComponent, type StageType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  parseComponentPointsTables,
  pointsForPosition,
  regulationChecksum,
  validateOfficialRegulation,
  type ComponentPointsTable,
} from "@/lib/regulations/championship-regulations";

export const regulationComponentPointsConnectorKey =
  "official-regulation-component-points";
export const regulationComponentPointsConnectorVersion =
  "official-regulation-component-points-v1";

type RegulationWithInputs = NonNullable<
  Awaited<ReturnType<typeof loadRegulationForComponentPoints>>
>;

type Candidate = {
  key: string;
  eventName: string;
  action:
    | "NEW_RESULT_POINT_COMPONENT"
    | "UPDATE_RESULT_POINT_COMPONENT"
    | "RESULT_POINT_COMPONENT_CONFLICT"
    | "RESULT_POINT_COMPONENT_INVALID"
    | "RESULT_POINT_COMPONENT_UNRESOLVED"
    | "RESULT_POINT_COMPONENT_MISSING_SOURCE";
  currentComponent: ResultPointComponent | null;
  currentValues: Record<string, unknown> | null;
  proposedValues: Record<string, unknown>;
  changedFields: string[];
  recommendation: string;
};

export async function createRegulationComponentPointsReviewRun({
  regulationId,
}: {
  regulationId: string;
}) {
  const regulation = await loadRegulationForComponentPoints(regulationId);
  if (!regulation) throw new Error("Regulation was not found.");
  assertRegulationCanGenerateComponentPoints(regulation);

  const validationIssues = validateOfficialRegulation(regulation);
  if (validationIssues.some((issue) => issue.severity === "error")) {
    throw new Error("Regulation has validation errors and cannot be used.");
  }

  const tables = parseComponentPointsTables(regulation.pointsMapping);
  if (tables.length === 0) {
    throw new Error("Regulation does not define named component points tables.");
  }

  const sourceLinks = await getSourceLinksByEntity([
    ...regulation.season.events.flatMap((event) => event.results),
    ...regulation.season.events.flatMap((event) =>
      event.stages.flatMap((stage) => stage.stageResults),
    ),
  ]);
  const versions = await getDataVersionsByEntity([
    ...regulation.season.events.flatMap((event) => event.results),
    ...regulation.season.events.flatMap((event) =>
      event.stages.flatMap((stage) => stage.stageResults),
    ),
  ]);

  const candidates = buildComponentCandidates({
    regulation,
    tables,
    sourceLinks,
    versions,
  });
  const missing = await buildMissingSourceWarnings({ regulation, candidates });
  const rows = [...candidates, ...missing];

  const normalizedPayload = {
    connectorVersion: regulationComponentPointsConnectorVersion,
    regulation: serializeRegulation(regulation, tables),
    seasonId: regulation.seasonId,
    seasonYear: regulation.season.year,
    rows: rows.map((row) => ({
      key: row.key,
      action: row.action,
      currentValues: row.currentValues,
      proposedValues: row.proposedValues,
      changedFields: row.changedFields,
    })),
  };
  const payloadChecksum = regulationChecksum(normalizedPayload);
  const runTimestamp = new Date();

  return prisma.$transaction(async (tx) => {
    let snapshot = await tx.connectorSnapshot.findUnique({
      where: {
        connectorKey_season_payloadChecksum: {
          connectorKey: regulationComponentPointsConnectorKey,
          season: regulation.season.year,
          payloadChecksum,
        },
      },
    });
    let snapshotStatus: "created" | "reused" = "reused";
    if (!snapshot) {
      snapshot = await tx.connectorSnapshot.create({
        data: {
          connectorKey: regulationComponentPointsConnectorKey,
          sourceKey: regulation.sourceUrl,
          season: regulation.season.year,
          runTimestamp,
          coverageMode: "full-season",
          inputSourceType: "official-regulation",
          requestedSourceUrl: regulation.sourceUrl,
          finalResponseUrl: regulation.sourceUrl,
          parserSelected: regulationComponentPointsConnectorVersion,
          rawRecordCount: rows.length,
          usableEventCount: regulation.season.events.length,
          rejectedRecordCount: rows.filter((row) =>
            [
              "RESULT_POINT_COMPONENT_INVALID",
              "RESULT_POINT_COMPONENT_UNRESOLVED",
            ].includes(row.action),
          ).length,
          rejectionReasons: rows.flatMap((row) =>
            getValidationErrors(row.proposedValues).map((issue) => String(issue.code)),
          ),
          fetchDurationMs: 0,
          executionDurationMs: 0,
          fallbackUsed: false,
          environment: process.env.NODE_ENV ?? "development",
          connectorVersion: regulationComponentPointsConnectorVersion,
          normalizedPayload: normalizedPayload as Prisma.InputJsonValue,
          matchingPayload: {
            regulationId: regulation.id,
            candidates: rows.map((row) => ({
              key: row.key,
              action: row.action,
              resultId: stringOrNull(row.proposedValues.resultId),
              stageResultId: stringOrNull(row.proposedValues.stageResultId),
              componentType: stringOrNull(row.proposedValues.componentType),
              points:
                typeof row.proposedValues.points === "number"
                  ? row.proposedValues.points
                  : null,
            })),
          } as Prisma.InputJsonValue,
          diagnostics: {
            regulationSourceSnapshotId: regulation.sourceSnapshotId,
            componentTables: tables.map((table) => ({
              key: table.key,
              componentType: table.componentType,
              inputMode: table.inputMode,
            })),
          } as Prisma.InputJsonValue,
          payloadChecksum,
        },
      });
      snapshotStatus = "created";
    }

    let created = 0;
    let reused = 0;
    let superseded = 0;
    for (const row of rows) {
      if (row.action === "RESULT_POINT_COMPONENT_CONFLICT") {
        if (row.currentComponent?.id) {
          const restoredWarnings = await tx.connectorReviewItem.updateMany({
            where: {
              connectorKey: regulationComponentPointsConnectorKey,
              currentResultPointComponentId: row.currentComponent.id,
              suggestedAction: "RESULT_POINT_COMPONENT_MISSING_SOURCE",
              reviewStatus: "PENDING",
            },
            data: { reviewStatus: "SUPERSEDED" },
          });
          superseded += restoredWarnings.count;
        }
        continue;
      }
      const deduplicationKey = `component-points:${regulationChecksum({
        action: row.action,
        current: row.currentValues,
        proposed: row.proposedValues,
        changedFields: row.changedFields,
      })}`;
      const existing = await tx.connectorReviewItem.findFirst({
        where: { deduplicationKey, reviewStatus: "PENDING" },
        select: { id: true },
      });
      if (existing) {
        reused += 1;
        continue;
      }

      const createdItem = await tx.connectorReviewItem.create({
        data: {
          snapshotId: snapshot.id,
          connectorKey: regulationComponentPointsConnectorKey,
          season: regulation.season.year,
          currentResultId: stringOrNull(row.proposedValues.resultId),
          currentStageResultId: stringOrNull(row.proposedValues.stageResultId),
          currentResultPointComponentId: row.currentComponent?.id ?? null,
          eventName: row.eventName,
          suggestedAction: row.action,
          reviewStatus: "PENDING",
          confidence: {
            score:
              row.action === "NEW_RESULT_POINT_COMPONENT" ||
              row.action === "UPDATE_RESULT_POINT_COMPONENT"
                ? 1
                : 0,
            source: "official-regulation",
          },
          matchingStrategy:
            stringOrNull(row.proposedValues.matchingMethod) ?? "component",
          currentValues: row.currentValues as Prisma.InputJsonValue,
          proposedValues: row.proposedValues as Prisma.InputJsonValue,
          changedFields: row.changedFields,
          recommendation: row.recommendation,
          deduplicationKey,
        },
      });

      const obsolete = await tx.connectorReviewItem.findMany({
        where: {
          connectorKey: regulationComponentPointsConnectorKey,
          currentResultId: stringOrNull(row.proposedValues.resultId),
          currentResultPointComponentId: row.currentComponent?.id ?? undefined,
          reviewStatus: "PENDING",
          id: { not: createdItem.id },
        },
        select: { id: true, deduplicationKey: true },
      });
      const obsoleteIds = obsolete
        .filter((item) => item.deduplicationKey !== deduplicationKey)
        .map((item) => item.id);
      if (obsoleteIds.length) {
        await tx.connectorReviewItem.updateMany({
          where: { id: { in: obsoleteIds }, reviewStatus: "PENDING" },
          data: {
            reviewStatus: "SUPERSEDED",
            supersededByReviewItemId: createdItem.id,
          },
        });
        superseded += obsoleteIds.length;
      }
      created += 1;
    }

    return {
      snapshotId: snapshot.id,
      snapshotStatus,
      payloadChecksum,
      regulationId: regulation.id,
      seasonYear: regulation.season.year,
      rows: rows.length,
      created,
      reused,
      superseded,
      validationIssues,
    };
  });
}

function buildComponentCandidates({
  regulation,
  tables,
  sourceLinks,
  versions,
}: {
  regulation: RegulationWithInputs;
  tables: ComponentPointsTable[];
  sourceLinks: Map<string, SourceLineage[]>;
  versions: Map<string, ManualLineage[]>;
}) {
  const candidates: Candidate[] = [];
  for (const event of regulation.season.events) {
    for (const table of tables) {
      if (table.inputMode === "RESULT") {
        for (const result of event.results) {
          if (!classMatches(result.className, regulation.className)) continue;
          const authority = inputAuthority("Result", result.id, sourceLinks, versions);
          candidates.push(
            buildEventLevelCandidate({ regulation, table, event, result, authority }),
          );
        }
        continue;
      }

      const matchingStages = event.stages.filter((stage) =>
        stageTypeCompatible(stage.stageType, table.componentType),
      );
      if (matchingStages.length !== 1) {
        candidates.push(
          unresolvedCandidate({
            regulation,
            table,
            event,
            reason:
              matchingStages.length === 0
                ? "No compatible RaceStage exists for this component table."
                : "Multiple compatible RaceStages exist for this component table.",
          }),
        );
        continue;
      }
      const stage = matchingStages[0];
      for (const stageResult of stage.stageResults) {
        if (!classMatches(stageResult.className, regulation.className)) continue;
        const result = event.results.find(
          (item) =>
            item.riderId === stageResult.riderId &&
            classMatches(item.className, stageResult.className),
        );
        if (!result) {
          candidates.push(
            unresolvedCandidate({
              regulation,
              table,
              event,
              stageId: stage.id,
              stageResultId: stageResult.id,
              reason: "StageResult rider has no matching applied overall Result.",
            }),
          );
          continue;
        }
        const authority = inputAuthority(
          "StageResult",
          stageResult.id,
          sourceLinks,
          versions,
        );
        candidates.push(
          buildStageCandidate({
            regulation,
            table,
            event,
            stage,
            result,
            stageResult,
            authority,
          }),
        );
      }
    }
  }
  return candidates;
}

async function buildMissingSourceWarnings({
  regulation,
  candidates,
}: {
  regulation: RegulationWithInputs;
  candidates: Candidate[];
}): Promise<Candidate[]> {
  const candidateKeys = new Set(candidates.map((candidate) => candidate.key));
  const components = await prisma.resultPointComponent.findMany({
    where: {
      regulationId: regulation.id,
      archivedAt: null,
    },
    include: {
      result: { include: { event: true, rider: true } },
    },
  });
  const links = await prisma.sourceLink.findMany({
    where: {
      entityType: "ResultPointComponent",
      entityId: { in: components.map((component) => component.id) },
    },
  });
  const sourceManagedIds = new Set(links.map((link) => link.entityId));
  return components
    .filter((component) => sourceManagedIds.has(component.id))
    .filter((component) => !candidateKeys.has(componentKey(component)))
    .map((component) => ({
      key: `missing:${component.id}`,
      eventName: `${component.result.event.name} · ${component.result.rider.firstName} ${component.result.rider.lastName}`,
      action: "RESULT_POINT_COMPONENT_MISSING_SOURCE" as const,
      currentComponent: component,
      currentValues: serializeComponent(component),
      proposedValues: {
        entityType: "ResultPointComponent",
        resultPointComponentId: component.id,
        resultId: component.resultId,
        eventId: component.eventId,
        componentType: component.componentType,
        classificationScope: component.classificationScope,
        className: component.className,
        regulationId: component.regulationId,
        regulationVersion: component.regulationVersion,
        regulationChecksum: component.regulationChecksum,
        regulationTableKey: component.regulationTableKey,
        applyEligible: false,
        validationWarnings: [
          {
            severity: "warning",
            code: "component-missing-from-source",
            message:
              "Existing source-managed scoring component is absent from the newest proposal set.",
          },
        ],
      },
      changedFields: [],
      recommendation:
        "Review the missing-source warning. This warning is intentionally non-applyable and does not modify the component.",
    }));
}

function buildEventLevelCandidate({
  regulation,
  table,
  event,
  result,
  authority,
}: {
  regulation: RegulationWithInputs;
  table: ComponentPointsTable;
  event: RegulationWithInputs["season"]["events"][number];
  result: RegulationWithInputs["season"]["events"][number]["results"][number];
  authority: InputAuthority;
}): Candidate {
  const position = result.overallPosition;
  const points = pointsForPosition(position, table.positions);
  const validationWarnings = [
    ...authority.warnings,
    ...(result.status !== "FINISHED"
      ? [
          {
            severity: "error",
            code: "unsupported-result-status",
            message: `Component points are only proposed for FINISHED results. Current status is ${result.status}.`,
          },
        ]
      : []),
    ...(points === null
      ? [
          {
            severity: "error",
            code: "missing-component-points-mapping",
            message: `No official component points mapping exists for position ${position ?? "unknown"}.`,
          },
        ]
      : []),
  ];
  const proposed = componentProposal({
    regulation,
    table,
    event,
    result,
    position,
    points,
    authority,
    matchingMethod: "event-result-position",
    rationale:
      "Regulation table explicitly uses event-level Result.overallPosition; no StageResult is required.",
    validationWarnings,
  });
  return classifyCandidate({ regulation, proposed, event, result });
}

function buildStageCandidate({
  regulation,
  table,
  event,
  stage,
  result,
  stageResult,
  authority,
}: {
  regulation: RegulationWithInputs;
  table: ComponentPointsTable;
  event: RegulationWithInputs["season"]["events"][number];
  stage: RegulationWithInputs["season"]["events"][number]["stages"][number];
  result: RegulationWithInputs["season"]["events"][number]["results"][number];
  stageResult: RegulationWithInputs["season"]["events"][number]["stages"][number]["stageResults"][number];
  authority: InputAuthority;
}): Candidate {
  const position = stageResult.overallPosition;
  const points = pointsForPosition(position, table.positions);
  const validationWarnings = [
    ...authority.warnings,
    ...(stageResult.status !== "FINISHED"
      ? [
          {
            severity: "error",
            code: "unsupported-stage-result-status",
            message: `Component points are only proposed for FINISHED StageResults. Current status is ${stageResult.status}.`,
          },
        ]
      : []),
    ...(stageResult.riderId !== result.riderId
      ? [
          {
            severity: "error",
            code: "stage-result-rider-mismatch",
            message: "StageResult rider does not match the linked Result rider.",
          },
        ]
      : []),
    ...(points === null
      ? [
          {
            severity: "error",
            code: "missing-component-points-mapping",
            message: `No official component points mapping exists for position ${position ?? "unknown"}.`,
          },
        ]
      : []),
  ];
  const proposed = componentProposal({
    regulation,
    table,
    event,
    result,
    stage,
    stageResult,
    position,
    points,
    authority,
    matchingMethod: "stage-type-exact",
    rationale:
      "Regulation table uses an applied StageResult from a compatible RaceStage.",
    validationWarnings,
  });
  return classifyCandidate({ regulation, proposed, event, result });
}

function classifyCandidate({
  regulation,
  proposed,
  event,
  result,
}: {
  regulation: RegulationWithInputs;
  proposed: Record<string, unknown>;
  event: RegulationWithInputs["season"]["events"][number];
  result: RegulationWithInputs["season"]["events"][number]["results"][number];
}): Candidate {
  const hasErrors = getValidationErrors(proposed).length > 0;
  const key = proposalKey(proposed);
  const current =
    regulation.resultPointComponents.find(
      (component) => componentKey(component) === key,
    ) ?? null;
  if (hasErrors) {
    return {
      key,
      eventName: `${event.name} · ${result.rider.firstName} ${result.rider.lastName}`,
      action: "RESULT_POINT_COMPONENT_INVALID",
      currentComponent: current,
      currentValues: current ? serializeComponent(current) : null,
      proposedValues: proposed,
      changedFields: [],
      recommendation: "Resolve validation issues before this component can be applied.",
    };
  }
  if (!current) {
    return {
      key,
      eventName: `${event.name} · ${result.rider.firstName} ${result.rider.lastName}`,
      action: "NEW_RESULT_POINT_COMPONENT",
      currentComponent: null,
      currentValues: null,
      proposedValues: { ...proposed, applyEligible: true },
      changedFields: [
        "resultPointComponent",
        "points",
        "position",
        "regulation",
        "sourceLineage",
      ],
      recommendation: "Review official component points before approval.",
    };
  }
  const currentValues = serializeComponent(current);
  const changedFields = diffComponent(currentValues, proposed);
  if (changedFields.length === 0) {
    return {
      key,
      eventName: `${event.name} · ${result.rider.firstName} ${result.rider.lastName}`,
      action: "RESULT_POINT_COMPONENT_CONFLICT",
      currentComponent: current,
      currentValues,
      proposedValues: { ...proposed, applyEligible: false, unchanged: true },
      changedFields: [],
      recommendation: "Existing component is unchanged.",
    };
  }
  return {
    key,
    eventName: `${event.name} · ${result.rider.firstName} ${result.rider.lastName}`,
    action: "UPDATE_RESULT_POINT_COMPONENT",
    currentComponent: current,
    currentValues,
    proposedValues: { ...proposed, applyEligible: true },
    changedFields,
    recommendation: "Review official component points update before approval.",
  };
}

function unresolvedCandidate({
  regulation,
  table,
  event,
  stageId,
  stageResultId,
  reason,
}: {
  regulation: RegulationWithInputs;
  table: ComponentPointsTable;
  event: RegulationWithInputs["season"]["events"][number];
  stageId?: string;
  stageResultId?: string;
  reason: string;
}): Candidate {
  return {
    key: `unresolved:${regulation.id}:${event.id}:${table.key}:${stageId ?? "none"}:${stageResultId ?? "none"}`,
    eventName: event.name,
    action: "RESULT_POINT_COMPONENT_UNRESOLVED",
    currentComponent: null,
    currentValues: null,
    proposedValues: {
      entityType: "ResultPointComponent",
      eventId: event.id,
      componentType: table.componentType,
      classificationScope: regulation.classificationScope,
      className: regulation.className,
      regulationId: regulation.id,
      regulationVersion: regulation.version,
      regulationChecksum: regulation.contentChecksum,
      regulationTableKey: table.key,
      raceStageId: stageId ?? null,
      stageResultId: stageResultId ?? null,
      applyEligible: false,
      validationWarnings: [
        {
          severity: "error",
          code: "unresolved-component-input",
          message: reason,
        },
      ],
    },
    changedFields: [],
    recommendation: "Resolve the component input match before approval.",
  };
}

function componentProposal({
  regulation,
  table,
  event,
  result,
  stage,
  stageResult,
  position,
  points,
  authority,
  matchingMethod,
  rationale,
  validationWarnings,
}: {
  regulation: RegulationWithInputs;
  table: ComponentPointsTable;
  event: RegulationWithInputs["season"]["events"][number];
  result: RegulationWithInputs["season"]["events"][number]["results"][number];
  stage?: RegulationWithInputs["season"]["events"][number]["stages"][number];
  stageResult?: RegulationWithInputs["season"]["events"][number]["stages"][number]["stageResults"][number];
  position: number | null;
  points: number | null;
  authority: InputAuthority;
  matchingMethod: string;
  rationale: string;
  validationWarnings: Array<Record<string, unknown>>;
}) {
  return {
    entityType: "ResultPointComponent",
    resultId: result.id,
    eventId: event.id,
    riderId: result.riderId,
    stageResultId: stageResult?.id ?? null,
    raceStageId: stage?.id ?? null,
    componentType: table.componentType,
    classificationScope: regulation.classificationScope,
    className: result.className,
    inputAuthorityType: authority.type,
    position,
    points,
    inputStatus: stageResult?.status ?? result.status,
    currentComponentPoints: null,
    proposedComponentPoints: points,
    regulationId: regulation.id,
    regulationVersion: regulation.version,
    regulationChecksum: regulation.contentChecksum,
    regulationTableKey: table.key,
    regulationMappingEntry:
      points === null ? null : { position, points, tableKey: table.key },
    regulationSource: {
      title: regulation.title,
      url: regulation.sourceUrl,
      year: regulation.regulationYear,
      section: regulation.section,
      verificationDate: regulation.verificationDate.toISOString(),
      sourceSnapshotId: regulation.sourceSnapshotId,
      contentChecksum: regulation.contentChecksum,
    },
    regulationSourceSnapshotId: regulation.sourceSnapshotId,
    inputResultSourceSnapshotId: authority.inputSourceSnapshotId,
    inputDataVersionId: authority.inputDataVersionId,
    inputAudit: authority.audit,
    sourceRowIdentifier: authority.sourceRowIdentifier,
    matchingMethod,
    stageAliasOrFallback: null,
    validationWarnings,
    currentEntityState: null,
    proposedEntityState: {
      resultId: result.id,
      stageResultId: stageResult?.id ?? null,
      raceStageId: stage?.id ?? null,
      eventId: event.id,
      componentType: table.componentType,
      classificationScope: regulation.classificationScope,
      className: result.className,
      position,
      points,
      regulationId: regulation.id,
      regulationVersion: regulation.version,
      regulationChecksum: regulation.contentChecksum,
      regulationTableKey: table.key,
      sourceSnapshotId: regulation.sourceSnapshotId,
    },
    applyEligible: validationWarnings.every((issue) => issue.severity !== "error"),
    calculationTimestamp: new Date().toISOString(),
    connectorVersion: regulationComponentPointsConnectorVersion,
    componentWithoutStageResultRationale: stageResult ? null : rationale,
    exactInputState: {
      result: serializeResult(result),
      stageResult: stageResult ? serializeStageResult(stageResult) : null,
      raceStage: stage ? serializeStage(stage) : null,
      regulation: serializeRegulation(regulation, [table]),
    },
  };
}

function inputAuthority(
  entityType: "Result" | "StageResult",
  entityId: string,
  sourceLinks: Map<string, SourceLineage[]>,
  versions: Map<string, ManualLineage[]>,
): InputAuthority {
  const key = `${entityType}:${entityId}`;
  const links = sourceLinks.get(key) ?? [];
  if (links.length) {
    return {
      type: "source-managed",
      inputSourceSnapshotId: links[0].sourceSnapshotId,
      sourceRowIdentifier: links[0].sourceRowIdentifier,
      inputDataVersionId: null,
      audit: null,
      warnings: [],
    };
  }
  const audit = versions.get(key)?.[0] ?? null;
  if (audit) {
    return {
      type: "manual",
      inputSourceSnapshotId: null,
      sourceRowIdentifier: null,
      inputDataVersionId: audit.id,
      audit,
      warnings: [],
    };
  }
  return {
    type: "manual",
    inputSourceSnapshotId: null,
    sourceRowIdentifier: null,
    inputDataVersionId: null,
    audit: null,
    warnings: [
      {
        severity: "error",
        code: "missing-input-authority",
        message: "Input row has neither source lineage nor manual DataVersion history.",
      },
    ],
  };
}

async function loadRegulationForComponentPoints(regulationId: string) {
  return prisma.championshipRegulation.findUnique({
    where: { id: regulationId },
    include: {
      sourceSnapshot: true,
      resultPointComponents: {
        where: { archivedAt: null },
      },
      season: {
        include: {
          events: {
            where: { archivedAt: null },
            include: {
              results: {
                where: { archivedAt: null },
                include: { rider: true },
                orderBy: [{ overallPosition: "asc" }, { id: "asc" }],
              },
              stages: {
                include: {
                  stageResults: {
                    where: { archivedAt: null },
                    include: { rider: true },
                    orderBy: [{ overallPosition: "asc" }, { id: "asc" }],
                  },
                },
                orderBy: [{ stageOrder: "asc" }, { id: "asc" }],
              },
            },
            orderBy: [{ startDate: "asc" }, { id: "asc" }],
          },
        },
      },
    },
  });
}

function assertRegulationCanGenerateComponentPoints(regulation: RegulationWithInputs) {
  if (regulation.status !== "ACTIVE") {
    throw new Error(
      "Only ACTIVE verified regulations can generate component point proposals.",
    );
  }
  if (regulation.archivedAt) {
    throw new Error("Archived regulations cannot generate component point proposals.");
  }
  if (!regulation.sourceSnapshotId || !regulation.contentChecksum) {
    throw new Error("Regulation source snapshot and checksum are required.");
  }
  const now = Date.now();
  if (regulation.effectiveFrom && regulation.effectiveFrom.getTime() > now) {
    throw new Error("Regulation is not effective yet.");
  }
  if (regulation.effectiveTo && regulation.effectiveTo.getTime() < now) {
    throw new Error("Regulation is no longer effective.");
  }
}

type SourceLineage = {
  sourceSnapshotId: string | null;
  sourceRowIdentifier: string | null;
};

type ManualLineage = {
  id: string;
  action: string;
  createdBy: string | null;
  createdAt: string;
};

type InputAuthority = {
  type: "source-managed" | "manual";
  inputSourceSnapshotId: string | null;
  sourceRowIdentifier: string | null;
  inputDataVersionId: string | null;
  audit: ManualLineage | null;
  warnings: Array<Record<string, unknown>>;
};

async function getSourceLinksByEntity(
  entities: Array<{ id: string; stageId?: string; eventId?: string }>,
) {
  const entityRefs = entities.map((entity) => ({
    entityType: "stageId" in entity ? "StageResult" : "Result",
    entityId: entity.id,
  }));
  const links = await prisma.sourceLink.findMany({
    where: {
      OR: entityRefs.map((entity) => ({
        entityType: entity.entityType,
        entityId: entity.entityId,
      })),
    },
    orderBy: { createdAt: "desc" },
  });
  const map = new Map<string, SourceLineage[]>();
  for (const link of links) {
    const key = `${link.entityType}:${link.entityId}`;
    const note = parseSourceLinkNote(link.note);
    map.set(key, [
      ...(map.get(key) ?? []),
      {
        sourceSnapshotId: note.sourceSnapshotId,
        sourceRowIdentifier: note.sourceRowIdentifier,
      },
    ]);
  }
  return map;
}

async function getDataVersionsByEntity(
  entities: Array<{ id: string; stageId?: string; eventId?: string }>,
) {
  const entityRefs = entities.map((entity) => ({
    entityType: "stageId" in entity ? "StageResult" : "Result",
    entityId: entity.id,
  }));
  const versions = await prisma.dataVersion.findMany({
    where: {
      OR: entityRefs.map((entity) => ({
        entityType: entity.entityType,
        entityId: entity.entityId,
      })),
    },
    orderBy: { createdAt: "desc" },
  });
  const map = new Map<string, ManualLineage[]>();
  for (const version of versions) {
    const key = `${version.entityType}:${version.entityId}`;
    map.set(key, [
      ...(map.get(key) ?? []),
      {
        id: version.id,
        action: version.action,
        createdBy: version.createdBy,
        createdAt: version.createdAt.toISOString(),
      },
    ]);
  }
  return map;
}

function parseSourceLinkNote(note: string | null) {
  if (!note) return { sourceSnapshotId: null, sourceRowIdentifier: null };
  const sourceSnapshotId = /snapshot[:=]\s*([a-zA-Z0-9_-]+)/.exec(note)?.[1] ?? null;
  const sourceRowIdentifier = /row[:=]\s*([a-zA-Z0-9_.:-]+)/.exec(note)?.[1] ?? null;
  return { sourceSnapshotId, sourceRowIdentifier };
}

function componentKey(component: {
  resultId: string;
  componentType: string;
  classificationScope: string;
  className: string | null;
  regulationId: string;
  regulationTableKey: string;
  stageResultId: string | null;
  raceStageId: string | null;
}) {
  return [
    component.resultId,
    component.componentType,
    component.classificationScope,
    component.className ?? "",
    component.regulationId,
    component.regulationTableKey,
    component.stageResultId ?? "",
    component.raceStageId ?? "",
  ].join(":");
}

function proposalKey(proposed: Record<string, unknown>) {
  return [
    proposed.resultId,
    proposed.componentType,
    proposed.classificationScope,
    proposed.className ?? "",
    proposed.regulationId,
    proposed.regulationTableKey,
    proposed.stageResultId ?? "",
    proposed.raceStageId ?? "",
  ].join(":");
}

function diffComponent(
  current: Record<string, unknown>,
  proposed: Record<string, unknown>,
) {
  const fields = [
    "position",
    "points",
    "regulationVersion",
    "regulationChecksum",
    "sourceSnapshotId",
  ];
  return fields.filter((field) => current[field] !== proposedField(proposed, field));
}

function proposedField(proposed: Record<string, unknown>, field: string) {
  if (field === "sourceSnapshotId") return proposed.regulationSourceSnapshotId;
  return proposed[field];
}

function serializeComponent(component: ResultPointComponent) {
  return {
    entityType: "ResultPointComponent",
    resultPointComponentId: component.id,
    resultId: component.resultId,
    stageResultId: component.stageResultId,
    raceStageId: component.raceStageId,
    eventId: component.eventId,
    componentType: component.componentType,
    classificationScope: component.classificationScope,
    className: component.className,
    position: component.position,
    points: component.points,
    regulationId: component.regulationId,
    regulationVersion: component.regulationVersion,
    regulationChecksum: component.regulationChecksum,
    regulationTableKey: component.regulationTableKey,
    sourceSnapshotId: component.sourceSnapshotId,
    archivedAt: component.archivedAt?.toISOString() ?? null,
  };
}

function serializeRegulation(
  regulation: RegulationWithInputs,
  tables: ComponentPointsTable[],
) {
  return {
    id: regulation.id,
    title: regulation.title,
    sourceUrl: regulation.sourceUrl,
    regulationYear: regulation.regulationYear,
    classificationScope: regulation.classificationScope,
    className: regulation.className,
    section: regulation.section,
    verificationDate: regulation.verificationDate.toISOString(),
    sourceSnapshotId: regulation.sourceSnapshotId,
    contentChecksum: regulation.contentChecksum,
    version: regulation.version,
    tables,
  };
}

function serializeResult(result: {
  id: string;
  eventId: string;
  riderId: string;
  className: string | null;
  overallPosition: number | null;
  status: string;
  points: number | null;
  updatedAt: Date;
}) {
  return {
    id: result.id,
    eventId: result.eventId,
    riderId: result.riderId,
    className: result.className,
    overallPosition: result.overallPosition,
    status: result.status,
    points: result.points,
    updatedAt: result.updatedAt.toISOString(),
  };
}

function serializeStageResult(stageResult: {
  id: string;
  stageId: string;
  riderId: string;
  className: string | null;
  overallPosition: number | null;
  status: string;
  updatedAt: Date;
}) {
  return {
    id: stageResult.id,
    stageId: stageResult.stageId,
    riderId: stageResult.riderId,
    className: stageResult.className,
    overallPosition: stageResult.overallPosition,
    status: stageResult.status,
    updatedAt: stageResult.updatedAt.toISOString(),
  };
}

function serializeStage(stage: {
  id: string;
  eventId: string;
  slug: string;
  name: string;
  stageType: StageType;
  stageOrder: number;
}) {
  return {
    id: stage.id,
    eventId: stage.eventId,
    slug: stage.slug,
    name: stage.name,
    stageType: stage.stageType,
    stageOrder: stage.stageOrder,
  };
}

function getValidationErrors(proposed: Record<string, unknown>) {
  const warnings = proposed.validationWarnings;
  if (!Array.isArray(warnings)) return [];
  return warnings.filter(
    (issue): issue is Record<string, unknown> =>
      Boolean(issue) &&
      typeof issue === "object" &&
      !Array.isArray(issue) &&
      issue.severity === "error",
  );
}

function stageTypeCompatible(stageType: StageType, componentType: string) {
  return stageType === componentType;
}

function classMatches(left: string | null, right: string | null) {
  return (left ?? null) === (right ?? null);
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
