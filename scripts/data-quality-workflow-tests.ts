import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ClassifiableEntityType, DataOriginStatus } from "@prisma/client";

import {
  createStableChecksum,
  getClassificationTransitionType,
  parseClassificationProposalPayload,
  recordClassificationApplyActions,
  recordClassificationConnectorKey,
  recordClassificationPayloadType,
  recordClassificationPayloadVersion,
  recordClassificationReviewActions,
  validateRecordClassificationApplicationPolicy,
} from "@/lib/data-quality/record-classification-workflow";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync(
  "prisma/migrations/20260717003000_record_classification_review_actions/migration.sql",
  "utf8",
);
const workflowSource = readFileSync(
  "lib/data-quality/record-classification-workflow.ts",
  "utf8",
);
const applySource = readFileSync("lib/admin/connector-review-application.ts", "utf8");
const panelSource = readFileSync("components/admin/classification-panel.tsx", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
};

main();

function main() {
  testSchemaAndMigration();
  testConstants();
  testApplicationPolicy();
  testPayloadParsing();
  testEvidenceAndLifecycleGuards();
  testTransitionTypes();
  testChecksumStability();
  testProposalGenerationIsReviewOnly();
  testAdminIntegration();
  testPackageScripts();

  console.log("Data quality workflow tests passed.");
}

function testSchemaAndMigration() {
  for (const action of [
    "NEW_RECORD_CLASSIFICATION",
    "UPDATE_RECORD_CLASSIFICATION",
    "RECORD_CLASSIFICATION_INVALID",
    "RECORD_CLASSIFICATION_CONFLICT",
    "RECORD_CLASSIFICATION_MISSING_EVIDENCE",
  ]) {
    assert.match(schema, new RegExp(`\\b${action}\\b`));
    assert.match(migration, new RegExp(`ADD VALUE IF NOT EXISTS '${action}'`));
  }

  assert.doesNotMatch(migration, /CREATE TABLE "RecordClassification"/);
  assert.doesNotMatch(migration, /ALTER TABLE "RecordClassification"/);
  assert.doesNotMatch(migration, /INSERT INTO|UPDATE "RecordClassification"|DELETE FROM/);
}

function testConstants() {
  assert.equal(recordClassificationConnectorKey, "record-classification-workflow");
  assert.equal(recordClassificationPayloadType, "record-classification");
  assert.equal(recordClassificationPayloadVersion, "record-classification-v1");
  assert.deepEqual([...recordClassificationApplyActions].sort(), [
    "NEW_RECORD_CLASSIFICATION",
    "UPDATE_RECORD_CLASSIFICATION",
  ]);
  assert.equal(recordClassificationReviewActions.size, 5);
}

function testApplicationPolicy() {
  const proposed = validPayload();

  for (const action of recordClassificationApplyActions) {
    assert.deepEqual(
      validateRecordClassificationApplicationPolicy({
        reviewStatus: "APPROVED",
        applicationStatus: "NOT_APPLIED",
        suggestedAction: action,
        proposedValues: proposed,
        changedFields: ["classification"],
      }),
      { ok: true },
    );
  }

  for (const action of [
    "RECORD_CLASSIFICATION_INVALID",
    "RECORD_CLASSIFICATION_CONFLICT",
    "RECORD_CLASSIFICATION_MISSING_EVIDENCE",
  ]) {
    const result = validateRecordClassificationApplicationPolicy({
      reviewStatus: "APPROVED",
      applicationStatus: "NOT_APPLIED",
      suggestedAction: action,
      proposedValues: proposed,
      changedFields: ["classification"],
    });
    assert.equal(result.ok, false);
  }

  assert.equal(
    validateRecordClassificationApplicationPolicy({
      reviewStatus: "APPROVED",
      applicationStatus: "NOT_APPLIED",
      suggestedAction: "NEW_RECORD_CLASSIFICATION",
      proposedValues: { ...proposed, applyEligible: false },
      changedFields: ["classification"],
    }).ok,
    false,
  );

  assert.equal(
    validateRecordClassificationApplicationPolicy({
      reviewStatus: "APPROVED",
      applicationStatus: "NOT_APPLIED",
      suggestedAction: "NEW_RECORD_CLASSIFICATION",
      proposedValues: proposed,
      changedFields: ["status"],
    }).ok,
    false,
  );

  assert.equal(
    validateRecordClassificationApplicationPolicy({
      reviewStatus: "APPROVED",
      applicationStatus: "NOT_APPLIED",
      suggestedAction: "NEW_RECORD_CLASSIFICATION",
      proposedValues: {
        ...proposed,
        payloadType: "result",
      },
      changedFields: ["classification"],
    }).ok,
    false,
  );
}

function testPayloadParsing() {
  const parsed = parseClassificationProposalPayload(validPayload());
  assert.equal(parsed.entityType, ClassifiableEntityType.RESULT);
  assert.equal(parsed.originStatus, DataOriginStatus.AUDITED_MANUAL);
  assert.equal(parsed.transitionType, "first-classification");
  assert.equal(parsed.applyEligible, true);

  assert.throws(
    () =>
      parseClassificationProposalPayload({
        ...validPayload(),
        originStatus: DataOriginStatus.ARCHIVED_HISTORY,
      }),
    /ARCHIVED_HISTORY/,
  );
  assert.throws(
    () =>
      parseClassificationProposalPayload({
        ...validPayload(),
        payloadVersion: "old-version",
      }),
    /version/,
  );
}

function testEvidenceAndLifecycleGuards() {
  assert.match(
    workflowSource,
    /Verified official classification requires matching SourceLink and SourceSnapshot evidence/,
  );
  assert.match(
    workflowSource,
    /SourceLink and SourceSnapshot evidence use different DataSources/,
  );
  assert.match(
    workflowSource,
    /Verified official classification requires an official DataSource/,
  );
  assert.match(
    workflowSource,
    /SourceLink URL does not match the official DataSource base URL/,
  );
  assert.match(
    workflowSource,
    /ConnectorReviewItem evidence is not tied to the classified entity/,
  );
  assert.match(
    workflowSource,
    /RecordClassification review items cannot be used as classification evidence/,
  );
  assert.match(workflowSource, /supportedReviewEvidenceActions/);
  assert.match(
    workflowSource,
    /Supporting review item action is not accepted classification evidence/,
  );
  assert.match(workflowSource, /Classified entity lifecycle changed/);
  assert.match(workflowSource, /Classified entity is archived or superseded/);
  assert.match(workflowSource, /entityLifecycleStateChecksum/);
  assert.match(workflowSource, /loadEntityLifecycleState/);
  assert.match(workflowSource, /reviewLinkedEntityIds/);
}

function testTransitionTypes() {
  assert.equal(
    getClassificationTransitionType(null, DataOriginStatus.SOURCE_MANAGED_UNVERIFIED),
    "first-classification",
  );
  assert.equal(
    getClassificationTransitionType(
      { originStatus: DataOriginStatus.DEMO },
      DataOriginStatus.VERIFIED_OFFICIAL,
    ),
    "promotion",
  );
  assert.equal(
    getClassificationTransitionType(
      { originStatus: DataOriginStatus.VERIFIED_OFFICIAL },
      DataOriginStatus.CONFLICTING,
    ),
    "re-quarantine",
  );
  assert.equal(
    getClassificationTransitionType(
      { originStatus: DataOriginStatus.AUDITED_MANUAL },
      DataOriginStatus.AUDITED_MANUAL,
    ),
    "correction",
  );
}

function testChecksumStability() {
  const left = {
    entityType: "RESULT",
    nested: { b: 2, a: 1 },
    list: [{ z: true, a: false }],
  };
  const right = {
    list: [{ a: false, z: true }],
    nested: { a: 1, b: 2 },
    entityType: "RESULT",
  };
  assert.equal(createStableChecksum(left), createStableChecksum(right));
}

function testProposalGenerationIsReviewOnly() {
  const proposalFunction = sourceBetween(
    workflowSource,
    "export async function createRecordClassificationReviewProposal",
    "export async function applyRecordClassificationReviewItem",
  );
  const snapshotFunction = sourceBetween(
    workflowSource,
    "async function findOrCreateSnapshot",
    "async function supersedeOlderClassificationProposals",
  );
  assert.match(snapshotFunction, /connectorSnapshot\.findFirst/);
  assert.match(snapshotFunction, /connectorSnapshot\.create/);
  assert.match(proposalFunction, /findOrCreateSnapshot/);
  assert.match(proposalFunction, /connectorReviewItem\.create/);
  assert.doesNotMatch(
    proposalFunction,
    /recordClassification\.(create|update|delete|upsert)/,
  );

  const applyFunction = sourceBetween(
    workflowSource,
    "export async function applyRecordClassificationReviewItem",
    "export function validateRecordClassificationApplicationPolicy",
  );
  assert.match(applyFunction, /recordClassification\.create/);
  assert.match(applyFunction, /recordClassification\.update/);
  assert.match(applyFunction, /dataVersion\.create/);
  assert.match(applyFunction, /evidenceStateChecksum/);
  assert.match(workflowSource, /Proposed classification is materially identical/);
}

function testAdminIntegration() {
  assert.match(applySource, /recordClassificationReviewActions/);
  assert.match(applySource, /applyRecordClassificationReviewItem/);
  assert.match(panelSource, /proposeRecordClassificationChange/);
  assert.doesNotMatch(panelSource, /ARCHIVED_HISTORY[\s\S]*<option/);
  assert.match(panelSource, /Creates an internal review item only/);
}

function testPackageScripts() {
  assert.equal(
    packageJson.scripts["test:data-quality-workflow"],
    "node --import tsx scripts/data-quality-workflow-tests.ts",
  );
  const occurrences = packageJson.scripts.test.match(/test:data-quality-workflow/g) ?? [];
  assert.equal(occurrences.length, 1);
}

function validPayload() {
  return {
    payloadType: recordClassificationPayloadType,
    payloadVersion: recordClassificationPayloadVersion,
    proposalVersion: 1,
    entityType: ClassifiableEntityType.RESULT,
    entityId: "result-1",
    currentState: "UNCLASSIFIED",
    originStatus: DataOriginStatus.AUDITED_MANUAL,
    reason: "Reviewed from admin evidence.",
    evidence: { note: "manual audit" },
    sourceLinkId: null,
    sourceSnapshotId: null,
    connectorReviewItemId: null,
    currentClassificationId: null,
    currentClassificationChecksum: createStableChecksum({ state: "UNCLASSIFIED" }),
    proposedClassificationChecksum: createStableChecksum({
      entityType: ClassifiableEntityType.RESULT,
      entityId: "result-1",
      originStatus: DataOriginStatus.AUDITED_MANUAL,
    }),
    transitionType: "first-classification",
    evidenceState: {
      sourceLink: null,
      sourceSnapshot: null,
      connectorReviewItem: null,
    },
    evidenceStateChecksum: createStableChecksum({
      sourceLink: null,
      sourceSnapshot: null,
      connectorReviewItem: null,
    }),
    entityLifecycleState: {
      entityType: ClassifiableEntityType.RESULT,
      entityId: "result-1",
      exists: true,
      label: "result-1",
      archivedAt: null,
      status: "FINISHED",
      visibility: null,
      updatedAt: "2026-07-17T00:00:00.000Z",
    },
    entityLifecycleStateChecksum: createStableChecksum({
      entityType: ClassifiableEntityType.RESULT,
      entityId: "result-1",
      exists: true,
      label: "result-1",
      archivedAt: null,
      status: "FINISHED",
      visibility: null,
      updatedAt: "2026-07-17T00:00:00.000Z",
    }),
    proposedAt: "2026-07-17T00:00:00.000Z",
    applyEligible: true,
    validationIssues: [],
  };
}

function sourceBetween(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  assert.notEqual(startIndex, -1, `Missing source start: ${start}`);
  assert.notEqual(endIndex, -1, `Missing source end: ${end}`);
  return source.slice(startIndex, endIndex);
}
