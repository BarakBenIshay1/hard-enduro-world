import { Prisma, type ResultPointComponent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  parseComponentEventFormats,
  parseComponentPointsTables,
  regulationChecksum,
  validateOfficialRegulation,
  type ComponentEventFormat,
} from "@/lib/regulations/championship-regulations";

export const componentPointsRollupConnectorKey = "official-component-points-rollup";
export const componentPointsRollupConnectorVersion =
  "official-component-points-rollup-v1";

type RollupRegulation = NonNullable<Awaited<ReturnType<typeof loadRollupRegulation>>>;

type EligibleComponent = RollupRegulation["resultPointComponents"][number] & {
  sourceLinkIds: string[];
  dataVersionIds: string[];
};

type RollupRow = {
  resultId: string;
  eventName: string;
  action: "UPDATE_RESULT" | "RESULT_INVALID" | null;
  currentValues: Record<string, unknown>;
  proposedValues: Record<string, unknown>;
  changedFields: string[];
  recommendation: string;
};

export async function createComponentPointsRollupReviewRun({
  regulationId,
}: {
  regulationId: string;
}) {
  const regulation = await loadRollupRegulation(regulationId);
  if (!regulation) throw new Error("Regulation was not found.");
  assertRollupRegulationReady(regulation);

  const tables = parseComponentPointsTables(regulation.pointsMapping);
  const formats = parseComponentEventFormats(regulation.pointsMapping);
  if (tables.length === 0 || formats.length === 0) {
    throw new Error("Regulation does not define component tables and event formats.");
  }

  const componentIds = regulation.resultPointComponents.map((component) => component.id);
  const [sourceLinks, dataVersions] = await Promise.all([
    prisma.sourceLink.findMany({
      where: {
        entityType: "ResultPointComponent",
        entityId: { in: componentIds },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dataVersion.findMany({
      where: {
        entityType: "ResultPointComponent",
        entityId: { in: componentIds },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const sourceLinkIdsByComponent = groupIdsByEntity(sourceLinks);
  const dataVersionIdsByComponent = groupIdsByEntity(dataVersions);
  const components: EligibleComponent[] = regulation.resultPointComponents.map(
    (component) => ({
      ...component,
      sourceLinkIds: sourceLinkIdsByComponent.get(component.id) ?? [],
      dataVersionIds: dataVersionIdsByComponent.get(component.id) ?? [],
    }),
  );

  const rows = regulation.season.events.flatMap((event) =>
    event.results
      .filter((result) => result.className === regulation.className)
      .map((result) =>
        buildRollupRow({
          regulation,
          formats,
          result,
          event,
          components: components.filter((component) => component.resultId === result.id),
        }),
      ),
  );
  const normalizedPayload = {
    connectorVersion: componentPointsRollupConnectorVersion,
    regulation: serializeRegulation(regulation, formats),
    seasonId: regulation.seasonId,
    seasonYear: regulation.season.year,
    rows: rows.map((row) => ({
      resultId: row.resultId,
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
          connectorKey: componentPointsRollupConnectorKey,
          season: regulation.season.year,
          payloadChecksum,
        },
      },
    });
    let snapshotStatus: "created" | "reused" = "reused";
    if (!snapshot) {
      snapshot = await tx.connectorSnapshot.create({
        data: {
          connectorKey: componentPointsRollupConnectorKey,
          sourceKey: regulation.sourceUrl,
          season: regulation.season.year,
          runTimestamp,
          coverageMode: "full-season",
          inputSourceType: "component-rollup",
          requestedSourceUrl: regulation.sourceUrl,
          finalResponseUrl: regulation.sourceUrl,
          parserSelected: componentPointsRollupConnectorVersion,
          rawRecordCount: rows.length,
          usableEventCount: regulation.season.events.length,
          rejectedRecordCount: rows.filter((row) => row.action === "RESULT_INVALID")
            .length,
          rejectionReasons: rows.flatMap((row) =>
            getValidationErrors(row.proposedValues).map((issue) => String(issue.code)),
          ),
          fetchDurationMs: 0,
          executionDurationMs: 0,
          fallbackUsed: false,
          environment: process.env.NODE_ENV ?? "development",
          connectorVersion: componentPointsRollupConnectorVersion,
          normalizedPayload: normalizedPayload as Prisma.InputJsonValue,
          matchingPayload: {
            regulationId: regulation.id,
            rows: rows.map((row) => ({
              resultId: row.resultId,
              action: row.action,
              currentPoints: row.currentValues.points,
              proposedPoints: row.proposedValues.points,
              componentIds: row.proposedValues.componentIds,
            })),
          } as Prisma.InputJsonValue,
          diagnostics: {
            sourceSnapshotId: regulation.sourceSnapshotId,
            regulationSourceSnapshotId: regulation.sourceSnapshotId,
            eventFormats: formats,
          } as Prisma.InputJsonValue,
          payloadChecksum,
        },
      });
      snapshotStatus = "created";
    }

    let created = 0;
    let reused = 0;
    let superseded = 0;
    let unchanged = 0;
    for (const row of rows) {
      if (!row.action) {
        unchanged += 1;
        continue;
      }
      const deduplicationKey = `component-rollup:${regulationChecksum({
        action: row.action,
        resultId: row.resultId,
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
          connectorKey: componentPointsRollupConnectorKey,
          season: regulation.season.year,
          currentResultId: row.resultId,
          eventName: row.eventName,
          suggestedAction: row.action,
          reviewStatus: "PENDING",
          confidence: {
            score: row.action === "UPDATE_RESULT" ? 1 : 0,
            source: "component-rollup",
          },
          matchingStrategy:
            stringOrNull(row.proposedValues.eventFormatMatchingMethod) ??
            "component-rollup",
          currentValues: row.currentValues as Prisma.InputJsonValue,
          proposedValues: row.proposedValues as Prisma.InputJsonValue,
          changedFields: row.changedFields,
          recommendation: row.recommendation,
          deduplicationKey,
        },
      });
      const obsolete = await tx.connectorReviewItem.findMany({
        where: {
          connectorKey: componentPointsRollupConnectorKey,
          currentResultId: row.resultId,
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
      unchanged,
    };
  });
}

function buildRollupRow({
  regulation,
  formats,
  result,
  event,
  components,
}: {
  regulation: RollupRegulation;
  formats: ComponentEventFormat[];
  result: RollupRegulation["season"]["events"][number]["results"][number];
  event: RollupRegulation["season"]["events"][number];
  components: EligibleComponent[];
}): RollupRow {
  const currentValues = serializeResult(result);
  const validationWarnings: Array<Record<string, unknown>> = [];
  if (result.archivedAt) {
    validationWarnings.push(
      errorIssue("archived-result", "Archived Result cannot receive rollup points."),
    );
  }
  if (result.status !== "FINISHED") {
    validationWarnings.push(
      errorIssue(
        "unsupported-result-status",
        "Only FINISHED Results can receive component rollup points.",
      ),
    );
  }

  const formatMatch = resolveEventFormat({ event, formats });
  validationWarnings.push(...formatMatch.validationWarnings);
  const format = formatMatch.format;
  const componentIssues = format
    ? validateComponentSet({
        regulation,
        result,
        event,
        format,
        components,
      })
    : {
        validComponents: [],
        validationWarnings: [],
        totalPoints: null,
      };
  validationWarnings.push(...componentIssues.validationWarnings);

  const proposedPoints = componentIssues.totalPoints;
  const hasErrors = validationWarnings.some((issue) => issue.severity === "error");
  const proposedValues = {
    entityType: "Result",
    payloadType: "component-points-rollup",
    resultId: result.id,
    eventId: event.id,
    seasonId: event.seasonId,
    riderId: result.riderId,
    classificationScope: regulation.classificationScope,
    className: result.className,
    status: result.status,
    overallPosition: result.overallPosition,
    points: proposedPoints,
    currentPoints: result.points,
    manualCurrentValue: result.points !== null,
    officialSourceUrl: regulation.sourceUrl,
    eventSlug: event.slug,
    eventName: event.name,
    eventFormatKey: format?.key ?? null,
    eventFormatMatchingMethod: formatMatch.matchingMethod,
    requiredComponentTables: format?.requiredTables ?? [],
    optionalComponentTables: format?.optionalTables ?? [],
    oneOfComponentTables: format?.oneOf ?? [],
    maximumEventPoints: format?.maximumPoints ?? null,
    componentIds: componentIssues.validComponents.map((component) => component.id),
    components: componentIssues.validComponents.map(serializeComponentForRollup),
    componentStates: componentIssues.validComponents.map((component) =>
      serializeComponentState(component),
    ),
    componentChecksums: componentIssues.validComponents.map((component) => ({
      id: component.id,
      checksum: regulationChecksum(serializeComponentState(component)),
    })),
    componentReviewItemIds: componentIssues.validComponents.map(
      (component) => component.connectorReviewItemId,
    ),
    componentSourceLinkIds: componentIssues.validComponents.flatMap(
      (component) => component.sourceLinkIds,
    ),
    componentDataVersionIds: componentIssues.validComponents.flatMap(
      (component) => component.dataVersionIds,
    ),
    regulationId: regulation.id,
    regulationVersion: regulation.version,
    regulationChecksum: regulation.contentChecksum,
    regulationMappingEntry: {
      eventFormatKey: format?.key ?? null,
      totalPoints: proposedPoints,
    },
    regulationSourceSnapshotId: regulation.sourceSnapshotId,
    regulationSource: {
      title: regulation.title,
      url: regulation.sourceUrl,
      year: regulation.regulationYear,
      section: regulation.section,
      verificationDate: regulation.verificationDate.toISOString(),
      sourceSnapshotId: regulation.sourceSnapshotId,
      contentChecksum: regulation.contentChecksum,
    },
    regulationSection: regulation.section,
    calculationVersion: componentPointsRollupConnectorVersion,
    calculationTimestamp: new Date().toISOString(),
    currentEntityState: currentValues,
    proposedEntityState: {
      ...currentValues,
      points: proposedPoints,
    },
    exactInputState: {
      result: currentValues,
      event: serializeEvent(event),
      regulation: serializeRegulation(regulation, formats),
      components: componentIssues.validComponents.map(serializeComponentState),
      eventFormat: format ?? null,
    },
    validationWarnings,
    applyEligible:
      !hasErrors && proposedPoints !== null && result.points !== proposedPoints,
  };
  const action =
    hasErrors || proposedPoints === null
      ? "RESULT_INVALID"
      : result.points === proposedPoints
        ? null
        : "UPDATE_RESULT";
  return {
    resultId: result.id,
    eventName: `${event.name} · ${result.rider.firstName} ${result.rider.lastName}`,
    action,
    currentValues,
    proposedValues,
    changedFields: action === "UPDATE_RESULT" ? ["points"] : [],
    recommendation:
      action === "UPDATE_RESULT"
        ? "Review component-derived event points before approval."
        : hasErrors
          ? "Resolve rollup validation issues before this Result can be updated."
          : "Component total already matches the current Result points.",
  };
}

function validateComponentSet({
  regulation,
  result,
  event,
  format,
  components,
}: {
  regulation: RollupRegulation;
  result: RollupRegulation["season"]["events"][number]["results"][number];
  event: RollupRegulation["season"]["events"][number];
  format: ComponentEventFormat;
  components: EligibleComponent[];
}) {
  const validationWarnings: Array<Record<string, unknown>> = [];
  const validComponents: EligibleComponent[] = [];
  const tableCounts = new Map<string, EligibleComponent[]>();
  for (const component of components) {
    const issues = validateComponentEligibility({ regulation, result, event, component });
    validationWarnings.push(...issues);
    if (issues.some((issue) => issue.severity === "error")) continue;
    validComponents.push(component);
    tableCounts.set(component.regulationTableKey, [
      ...(tableCounts.get(component.regulationTableKey) ?? []),
      component,
    ]);
  }

  for (const key of format.requiredTables) {
    const count = tableCounts.get(key)?.length ?? 0;
    if (count !== 1) {
      validationWarnings.push(
        errorIssue(
          count === 0 ? "missing-required-component" : "duplicate-required-component",
          `Event format ${format.key} requires exactly one ${key} component.`,
        ),
      );
    }
  }
  for (const group of format.oneOf) {
    const count = group.reduce(
      (sum, key) => sum + (tableCounts.get(key)?.length ?? 0),
      0,
    );
    if (count !== 1) {
      validationWarnings.push(
        errorIssue(
          count === 0 ? "missing-one-of-component" : "conflicting-one-of-component",
          `Event format ${format.key} requires exactly one component from ${group.join(", ")}.`,
        ),
      );
    }
  }
  const allowed = new Set([
    ...format.requiredTables,
    ...format.optionalTables,
    ...format.oneOf.flatMap((group) => group),
  ]);
  for (const key of tableCounts.keys()) {
    if (!allowed.has(key)) {
      validationWarnings.push(
        errorIssue(
          "unexpected-component",
          `Component table ${key} is not allowed for event format ${format.key}.`,
        ),
      );
    }
    if ((tableCounts.get(key)?.length ?? 0) > 1) {
      validationWarnings.push(
        errorIssue(
          "duplicate-component",
          `Component table ${key} appears more than once.`,
        ),
      );
    }
  }

  const totalPoints = validComponents.reduce(
    (sum, component) => sum + component.points,
    0,
  );
  if (!Number.isSafeInteger(totalPoints) || totalPoints > 2_147_483_647) {
    validationWarnings.push(
      errorIssue("points-overflow", "Rollup points exceed the supported integer range."),
    );
  }
  if (format.maximumPoints !== null && totalPoints > format.maximumPoints) {
    validationWarnings.push(
      errorIssue(
        "over-maximum-points",
        `Rollup total exceeds maximum event points for format ${format.key}.`,
      ),
    );
  }
  return { validComponents, validationWarnings, totalPoints };
}

function validateComponentEligibility({
  regulation,
  result,
  event,
  component,
}: {
  regulation: RollupRegulation;
  result: RollupRegulation["season"]["events"][number]["results"][number];
  event: RollupRegulation["season"]["events"][number];
  component: EligibleComponent;
}) {
  const issues: Array<Record<string, unknown>> = [];
  const review = component.connectorReviewItem;
  if (!review)
    issues.push(
      errorIssue(
        "missing-applied-component-review",
        "Component has no applied review lineage.",
      ),
    );
  if (review) {
    if (
      !["NEW_RESULT_POINT_COMPONENT", "UPDATE_RESULT_POINT_COMPONENT"].includes(
        review.suggestedAction,
      )
    ) {
      issues.push(
        errorIssue(
          "invalid-component-review-action",
          "Component review action is not applyable component points.",
        ),
      );
    }
    if (review.reviewStatus !== "APPROVED" || review.applicationStatus !== "APPLIED") {
      issues.push(
        errorIssue(
          "component-review-not-applied",
          "Component review was not approved and applied.",
        ),
      );
    }
    if (review.appliedResultPointComponentId !== component.id) {
      issues.push(
        errorIssue(
          "component-review-link-mismatch",
          "Component review does not apply this exact component.",
        ),
      );
    }
  }
  if (component.archivedAt)
    issues.push(
      errorIssue(
        "archived-component",
        "Archived component cannot participate in rollup.",
      ),
    );
  if (component.resultId !== result.id)
    issues.push(
      errorIssue("component-result-mismatch", "Component belongs to another Result."),
    );
  if (component.eventId !== event.id)
    issues.push(
      errorIssue("component-event-mismatch", "Component belongs to another Event."),
    );
  if (component.regulationId !== regulation.id)
    issues.push(
      errorIssue(
        "component-regulation-mismatch",
        "Component belongs to another Regulation.",
      ),
    );
  if (component.regulationVersion !== regulation.version)
    issues.push(
      errorIssue(
        "component-regulation-version-mismatch",
        "Component Regulation version differs from the active Regulation.",
      ),
    );
  if (component.regulationChecksum !== regulation.contentChecksum)
    issues.push(
      errorIssue(
        "component-regulation-checksum-mismatch",
        "Component Regulation checksum differs from the active Regulation.",
      ),
    );
  if (component.classificationScope !== regulation.classificationScope)
    issues.push(
      errorIssue(
        "component-scope-mismatch",
        "Component classification scope differs from the Regulation.",
      ),
    );
  if (
    component.className !== regulation.className ||
    component.className !== result.className
  )
    issues.push(
      errorIssue(
        "component-class-mismatch",
        "Component class differs from the Result or Regulation.",
      ),
    );
  if (component.points < 0)
    issues.push(
      errorIssue(
        "negative-component-points",
        "Negative component points are not supported.",
      ),
    );
  if (!Number.isInteger(component.points))
    issues.push(
      errorIssue(
        "decimal-component-points",
        "Decimal component points are not supported.",
      ),
    );
  if (component.sourceLinkIds.length === 0)
    issues.push(
      errorIssue(
        "missing-component-source-link",
        "Component is missing SourceLink lineage.",
      ),
    );
  if (component.dataVersionIds.length === 0)
    issues.push(
      errorIssue(
        "missing-component-data-version",
        "Component is missing DataVersion lineage.",
      ),
    );
  if (component.stageResult && component.raceStage) {
    if (component.stageResult.stageId !== component.raceStage.id)
      issues.push(
        errorIssue(
          "stage-result-stage-mismatch",
          "Component StageResult does not belong to the RaceStage.",
        ),
      );
    if (component.raceStage.eventId !== event.id)
      issues.push(
        errorIssue(
          "race-stage-event-mismatch",
          "Component RaceStage belongs to another Event.",
        ),
      );
    if (component.stageResult.riderId !== result.riderId)
      issues.push(
        errorIssue(
          "stage-result-rider-mismatch",
          "Component StageResult rider differs from Result rider.",
        ),
      );
    if (component.raceStage.stageType !== component.componentType)
      issues.push(
        errorIssue(
          "race-stage-type-mismatch",
          "RaceStage type differs from component type.",
        ),
      );
  }
  return issues;
}

function resolveEventFormat({
  event,
  formats,
}: {
  event: RollupRegulation["season"]["events"][number];
  formats: ComponentEventFormat[];
}) {
  const explicit = formats.filter(
    (format) =>
      format.eventIds.includes(event.id) || format.eventSlugs.includes(event.slug),
  );
  if (explicit.length === 1) {
    return {
      format: explicit[0],
      matchingMethod: explicit[0].eventIds.includes(event.id)
        ? "regulation-event-id"
        : "regulation-event-slug",
      validationWarnings: [],
    };
  }
  if (explicit.length > 1) {
    return {
      format: null,
      matchingMethod: "ambiguous-explicit-format",
      validationWarnings: [
        errorIssue(
          "ambiguous-event-format",
          "Multiple event formats matched this Event.",
        ),
      ],
    };
  }
  const unscoped = formats.filter(
    (format) => format.eventIds.length === 0 && format.eventSlugs.length === 0,
  );
  if (formats.length === 1 && unscoped.length === 1) {
    return {
      format: formats[0],
      matchingMethod: "single-active-format",
      validationWarnings: [],
    };
  }
  return {
    format: null,
    matchingMethod: "unresolved-event-format",
    validationWarnings: [
      errorIssue(
        "unresolved-event-format",
        "No explicit Regulation event format matched this Event.",
      ),
    ],
  };
}

async function loadRollupRegulation(regulationId: string) {
  return prisma.championshipRegulation.findUnique({
    where: { id: regulationId },
    include: {
      sourceSnapshot: true,
      resultPointComponents: {
        where: { archivedAt: null },
        include: {
          connectorReviewItem: true,
          stageResult: true,
          raceStage: true,
        },
        orderBy: [{ regulationTableKey: "asc" }, { id: "asc" }],
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
            },
            orderBy: [{ startDate: "asc" }, { id: "asc" }],
          },
        },
      },
    },
  });
}

function assertRollupRegulationReady(regulation: RollupRegulation) {
  if (regulation.status !== "ACTIVE") {
    throw new Error("Only ACTIVE verified regulations can generate rollup proposals.");
  }
  if (regulation.archivedAt)
    throw new Error("Archived regulations cannot roll up points.");
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
  const validationIssues = validateOfficialRegulation(regulation);
  if (validationIssues.some((issue) => issue.severity === "error")) {
    throw new Error("Regulation has validation errors and cannot be used.");
  }
}

function groupIdsByEntity(rows: Array<{ entityId: string; id: string }>) {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    map.set(row.entityId, [...(map.get(row.entityId) ?? []), row.id]);
  }
  return map;
}

function serializeComponentForRollup(component: EligibleComponent) {
  return {
    id: component.id,
    points: component.points,
    componentType: component.componentType,
    regulationTableKey: component.regulationTableKey,
    position: component.position,
    connectorReviewItemId: component.connectorReviewItemId,
    sourceLinkIds: component.sourceLinkIds,
    dataVersionIds: component.dataVersionIds,
  };
}

function serializeComponentState(component: ResultPointComponent) {
  return {
    id: component.id,
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
    connectorReviewItemId: component.connectorReviewItemId,
    archivedAt: component.archivedAt?.toISOString() ?? null,
    updatedAt: component.updatedAt.toISOString(),
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
  archivedAt: Date | null;
  updatedAt: Date;
}) {
  return {
    entityType: "Result",
    resultId: result.id,
    eventId: result.eventId,
    riderId: result.riderId,
    className: result.className,
    overallPosition: result.overallPosition,
    points: result.points,
    status: result.status,
    archivedAt: result.archivedAt?.toISOString() ?? null,
    updatedAt: result.updatedAt.toISOString(),
  };
}

function serializeEvent(event: {
  id: string;
  slug: string;
  seasonId: string;
  startDate: Date;
}) {
  return {
    id: event.id,
    slug: event.slug,
    seasonId: event.seasonId,
    startDate: event.startDate.toISOString(),
  };
}

function serializeRegulation(
  regulation: RollupRegulation,
  formats: ComponentEventFormat[],
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
    eventFormats: formats,
    effectiveFrom: regulation.effectiveFrom?.toISOString() ?? null,
    effectiveTo: regulation.effectiveTo?.toISOString() ?? null,
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

function errorIssue(code: string, message: string) {
  return { severity: "error", code, message };
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
