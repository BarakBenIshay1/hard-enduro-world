import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseComponentPointsTables,
  parsePointsMapping,
  pointsForPosition,
  regulationChecksum,
  validateOfficialRegulation,
} from "@/lib/regulations/championship-regulations";
import { validateConnectorReviewApplicationPolicy } from "@/lib/admin/connector-review-application";

testMissingSourceFailsClosed();
testPointsMappingValidation();
testComponentPointsTableValidation();
testTieBreakValidation();
testResultPointsApplyPolicy();
testResultPointComponentApplyPolicy();
testResultPointComponentPolicyRejectsMissingLineage();
testResultPointComponentPolicyAllowsShapeBeforeTransactionalLineageCheck();
testResultPointsApplyPolicyRejectsMissingLineage();
testResultPointComponentMissingSourceRestoredLifecycle();
testRegulationLifecycleArchitecture();
testStableRegulationChecksum();

console.log("Regulations workflow tests passed.");

function testMissingSourceFailsClosed() {
  const issues = validateOfficialRegulation({
    title: "",
    sourceUrl: "",
    regulationYear: 2026,
    section: "",
    verificationDate: new Date("2026-01-01T00:00:00.000Z"),
    sourceSnapshotId: null,
    contentChecksum: null,
    pointsMapping: [],
    tieBreakRules: null,
  });
  assert.equal(
    issues.some((issue) => issue.code === "missing-source-title"),
    true,
  );
  assert.equal(
    issues.some((issue) => issue.code === "missing-source-url"),
    true,
  );
  assert.equal(
    issues.some((issue) => issue.code === "missing-section"),
    true,
  );
  assert.equal(
    issues.some((issue) => issue.code === "missing-points-mapping"),
    true,
  );
  assert.equal(
    issues.some((issue) => issue.code === "missing-tie-break-rules"),
    true,
  );
  assert.equal(
    issues.some((issue) => issue.code === "missing-source-snapshot"),
    true,
  );
  assert.equal(
    issues.some((issue) => issue.code === "missing-content-checksum"),
    true,
  );

  const unsupportedUrlIssues = validateOfficialRegulation({
    title: "Unsupported Source",
    sourceUrl: "https://example.com/official-regulation.pdf",
    regulationYear: 2026,
    section: "Article 1",
    verificationDate: new Date("2026-01-01T00:00:00.000Z"),
    sourceSnapshotId: "snapshot-1",
    contentChecksum: "checksum-1",
    pointsMapping: [{ position: 1, points: 20 }],
    tieBreakRules: [tieBreak("wins", 1)],
  });
  assert.equal(
    unsupportedUrlIssues.some((issue) => issue.code === "unsupported-official-source"),
    true,
  );
}

function testComponentPointsTableValidation() {
  const validTables = parseComponentPointsTables({
    tables: [
      {
        key: "prologue",
        componentType: "PROLOGUE",
        positions: [
          { position: 2, points: 1 },
          { position: 1, points: 3 },
        ],
      },
      {
        key: "main_event",
        componentType: "MAIN_EVENT",
        inputMode: "RESULT",
        positions: [{ position: 1, points: 20 }],
      },
    ],
  });
  assert.deepEqual(validTables, [
    {
      key: "prologue",
      componentType: "PROLOGUE",
      inputMode: "STAGE_RESULT",
      positions: [
        { position: 1, points: 3 },
        { position: 2, points: 1 },
      ],
    },
    {
      key: "main_event",
      componentType: "MAIN_EVENT",
      inputMode: "RESULT",
      positions: [{ position: 1, points: 20 }],
    },
  ]);

  const duplicateTableIssues = validateOfficialRegulation({
    title: "Official Test Regulation",
    sourceUrl: "https://www.fim-moto.com/en/documents/regulations.pdf",
    regulationYear: 2026,
    section: "Article 060.9",
    verificationDate: new Date("2026-01-01T00:00:00.000Z"),
    sourceSnapshotId: "snapshot-1",
    contentChecksum: "checksum-1",
    pointsMapping: {
      tables: [
        {
          key: "sprint",
          componentType: "SPRINT",
          positions: [
            { position: 1, points: 10 },
            { position: 1, points: 8 },
          ],
        },
        {
          key: "sprint",
          componentType: "FINAL",
          positions: [{ position: 1, points: 20 }],
        },
      ],
    },
    tieBreakRules: [tieBreak("wins", 1)],
  });
  assert.equal(
    duplicateTableIssues.some(
      (issue) => issue.code === "duplicate-component-table-position",
    ),
    true,
  );
  assert.equal(
    duplicateTableIssues.some((issue) => issue.code === "duplicate-component-table-key"),
    true,
  );

  const invalidTypeIssues = validateOfficialRegulation({
    title: "Official Test Regulation",
    sourceUrl: "https://www.fim-moto.com/en/documents/regulations.pdf",
    regulationYear: 2026,
    section: "Article 060.9",
    verificationDate: new Date("2026-01-01T00:00:00.000Z"),
    sourceSnapshotId: "snapshot-1",
    contentChecksum: "checksum-1",
    pointsMapping: {
      tables: [
        {
          key: "bonus",
          componentType: "BONUS",
          positions: [{ position: 1, points: 1 }],
        },
      ],
    },
    tieBreakRules: [tieBreak("wins", 1)],
  });
  assert.equal(
    invalidTypeIssues.some((issue) => issue.code === "invalid-component-table"),
    true,
  );
}

function testPointsMappingValidation() {
  const duplicateIssues = validateOfficialRegulation({
    title: "Official Test Regulation",
    sourceUrl: "https://www.fim-moto.com/en/documents/regulations.pdf",
    regulationYear: 2026,
    section: "Article 1",
    verificationDate: new Date("2026-01-01T00:00:00.000Z"),
    sourceSnapshotId: "snapshot-1",
    contentChecksum: "checksum-1",
    pointsMapping: [
      { position: 1, points: 20 },
      { position: 1, points: 17 },
      { position: "x", points: 15 },
    ],
    tieBreakRules: [tieBreak("wins", 1)],
  });
  assert.equal(
    duplicateIssues.some((issue) => issue.code === "duplicate-position-mapping"),
    true,
  );
  assert.equal(
    duplicateIssues.some((issue) => issue.code === "invalid-points-mapping"),
    true,
  );

  const mapping = parsePointsMapping([
    { position: 2, points: 17 },
    { position: 1, points: 20 },
  ]);
  assert.deepEqual(mapping, [
    { position: 1, points: 20 },
    { position: 2, points: 17 },
  ]);
  assert.equal(pointsForPosition(1, mapping), 20);
  assert.equal(pointsForPosition(99, mapping), null);
}

function testTieBreakValidation() {
  const issues = validateOfficialRegulation({
    title: "Official Test Regulation",
    sourceUrl: "https://www.fim-moto.com/en/documents/regulations.pdf",
    regulationYear: 2026,
    section: "Article 1",
    verificationDate: new Date("2026-01-01T00:00:00.000Z"),
    sourceSnapshotId: "snapshot-1",
    contentChecksum: "checksum-1",
    pointsMapping: [{ position: 1, points: 20 }],
    tieBreakRules: [{ type: "rider-name", order: 1, section: "Article 2" }],
  });
  assert.equal(
    issues.some((issue) => issue.code === "invalid-tie-break-rule"),
    true,
  );
}

function testResultPointsApplyPolicy() {
  const result = validateConnectorReviewApplicationPolicy({
    reviewStatus: "APPROVED",
    applicationStatus: "NOT_APPLIED",
    suggestedAction: "UPDATE_RESULT",
    changedFields: ["points"],
    proposedValues: {
      entityType: "Result",
      eventId: "event-1",
      riderId: "rider-1",
      className: null,
      overallPosition: 1,
      points: 20,
      status: "FINISHED",
      officialSourceUrl: "https://example.com/official-regulation.pdf",
      validationWarnings: [],
      applyEligible: true,
      regulationId: "regulation-1",
      regulationVersion: 1,
      regulationChecksum: "checksum-1",
      regulationSourceSnapshotId: "snapshot-1",
      regulationMappingEntry: {
        position: 1,
        points: 20,
      },
      regulationSource: {
        title: "Official Test Regulation",
        url: "https://www.fim-moto.com/en/documents/regulations.pdf",
        section: "Article 1",
        sourceSnapshotId: "snapshot-1",
        contentChecksum: "checksum-1",
      },
      regulationSection: "Article 1",
    },
  });
  assert.deepEqual(result, { ok: true });
}

function testResultPointComponentApplyPolicy() {
  const result = validateConnectorReviewApplicationPolicy({
    reviewStatus: "APPROVED",
    applicationStatus: "NOT_APPLIED",
    suggestedAction: "NEW_RESULT_POINT_COMPONENT",
    changedFields: [
      "resultPointComponent",
      "points",
      "position",
      "regulation",
      "sourceLineage",
    ],
    proposedValues: {
      entityType: "ResultPointComponent",
      resultId: "result-1",
      eventId: "event-1",
      riderId: "rider-1",
      stageResultId: "stage-result-1",
      raceStageId: "race-stage-1",
      componentType: "PROLOGUE",
      classificationScope: "WORLD_CHAMPIONSHIP",
      className: null,
      inputAuthorityType: "source-managed",
      position: 1,
      points: 3,
      inputStatus: "FINISHED",
      regulationId: "regulation-1",
      regulationVersion: 1,
      regulationChecksum: "checksum-1",
      regulationTableKey: "prologue",
      regulationMappingEntry: {
        position: 1,
        points: 3,
        tableKey: "prologue",
      },
      regulationSource: {
        title: "Official Test Regulation",
        url: "https://www.fim-moto.com/en/documents/regulations.pdf",
        section: "Article 060.9",
        sourceSnapshotId: "snapshot-1",
        contentChecksum: "checksum-1",
      },
      regulationSourceSnapshotId: "snapshot-1",
      inputResultSourceSnapshotId: "input-snapshot-1",
      matchingMethod: "stage-type-exact",
      validationWarnings: [],
      proposedEntityState: {},
      applyEligible: true,
      calculationTimestamp: "2026-01-01T00:00:00.000Z",
      connectorVersion: "official-regulation-component-points-v1",
      exactInputState: {},
    },
  });
  assert.deepEqual(result, { ok: true });
}

function testResultPointComponentPolicyRejectsMissingLineage() {
  const result = validateConnectorReviewApplicationPolicy({
    reviewStatus: "APPROVED",
    applicationStatus: "NOT_APPLIED",
    suggestedAction: "NEW_RESULT_POINT_COMPONENT",
    changedFields: ["points"],
    proposedValues: {
      entityType: "ResultPointComponent",
      resultId: "result-1",
      eventId: "event-1",
      riderId: "rider-1",
      componentType: "PROLOGUE",
      classificationScope: "WORLD_CHAMPIONSHIP",
      position: 1,
      points: 3,
      applyEligible: true,
    },
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.reason,
      "Component proposals require verified regulation lineage.",
    );
  }
}

function testResultPointComponentPolicyAllowsShapeBeforeTransactionalLineageCheck() {
  const result = validateConnectorReviewApplicationPolicy({
    reviewStatus: "APPROVED",
    applicationStatus: "NOT_APPLIED",
    suggestedAction: "NEW_RESULT_POINT_COMPONENT",
    changedFields: ["points"],
    proposedValues: {
      entityType: "ResultPointComponent",
      resultId: "result-1",
      eventId: "event-1",
      riderId: "rider-1",
      componentType: "PROLOGUE",
      classificationScope: "WORLD_CHAMPIONSHIP",
      inputAuthorityType: "source-managed",
      position: 1,
      points: 3,
      regulationId: "regulation-1",
      regulationVersion: 1,
      regulationChecksum: "checksum-1",
      regulationTableKey: "prologue",
      regulationMappingEntry: {
        position: 1,
        points: 3,
        tableKey: "prologue",
      },
      regulationSource: {
        title: "Official Test Regulation",
        url: "https://www.fim-moto.com/en/documents/regulations.pdf",
        section: "Article 060.9",
        sourceSnapshotId: "snapshot-1",
        contentChecksum: "checksum-1",
      },
      regulationSourceSnapshotId: "snapshot-1",
      validationWarnings: [],
      applyEligible: true,
    },
  });
  assert.deepEqual(result, { ok: true });
}

function testResultPointsApplyPolicyRejectsMissingLineage() {
  const result = validateConnectorReviewApplicationPolicy({
    reviewStatus: "APPROVED",
    applicationStatus: "NOT_APPLIED",
    suggestedAction: "UPDATE_RESULT",
    changedFields: ["points"],
    proposedValues: {
      entityType: "Result",
      eventId: "event-1",
      riderId: "rider-1",
      className: null,
      overallPosition: 1,
      points: 20,
      status: "FINISHED",
      officialSourceUrl: "https://www.fim-moto.com/en/documents/regulations.pdf",
      validationWarnings: [],
      applyEligible: true,
      regulationId: "regulation-1",
      regulationVersion: 1,
    },
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.reason,
      "Result points updates require verified regulation lineage.",
    );
  }
}

function testResultPointComponentMissingSourceRestoredLifecycle() {
  const service = readFileSync("lib/admin/regulation-component-points.ts", "utf8");
  assert.doesNotMatch(
    service,
    /return candidates\.filter\(\s*\(candidate\) => candidate\.action !== "RESULT_POINT_COMPONENT_CONFLICT"/,
  );
  assert.match(service, /suggestedAction: "RESULT_POINT_COMPONENT_MISSING_SOURCE"/);
  assert.match(service, /data: \{ reviewStatus: "SUPERSEDED" \}/);
}

function testStableRegulationChecksum() {
  assert.equal(
    regulationChecksum({ b: 2, a: [{ position: 1, points: 20 }] }),
    regulationChecksum({ a: [{ points: 20, position: 1 }], b: 2 }),
  );
}

function testRegulationLifecycleArchitecture() {
  const cms = readFileSync("lib/admin/regulation-cms.ts", "utf8");
  const actions = readFileSync("app/admin/regulations/actions.ts", "utf8");
  assert.match(cms, /createDraftRegulation/);
  assert.match(cms, /updateDraftRegulation/);
  assert.match(cms, /activateRegulation/);
  assert.match(cms, /deactivateRegulation/);
  assert.match(cms, /archiveRegulation/);
  assert.match(cms, /restoreRegulation/);
  assert.match(cms, /createRegulationVersion/);
  assert.match(cms, /status === "ACTIVE"/);
  assert.match(cms, /tx\.dataVersion\.create/);
  assert.match(actions, /hasPermission\(session, "calculations:review"\)/);
}

function tieBreak(type: string, order: number) {
  return {
    type,
    order,
    description: "Most wins",
    section: "Article 2",
  };
}
