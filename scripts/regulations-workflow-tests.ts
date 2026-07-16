import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parsePointsMapping,
  pointsForPosition,
  regulationChecksum,
  validateOfficialRegulation,
} from "@/lib/regulations/championship-regulations";
import { validateConnectorReviewApplicationPolicy } from "@/lib/admin/connector-review-application";

testMissingSourceFailsClosed();
testPointsMappingValidation();
testTieBreakValidation();
testResultPointsApplyPolicy();
testResultPointsApplyPolicyRejectsMissingLineage();
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
