import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ClassifiableEntityType, DataOriginStatus } from "@prisma/client";

import {
  assertClassifiableEntityExists,
  classifiableEntityExists,
  classifiableEntityTypes,
  getOfficialWorkflowEligibility,
  getRecordClassificationHistory,
  isExplicitlyQuarantined,
  normalizeLegacyEntityType,
  resolveRecordClassification,
} from "@/lib/data-quality/record-classification";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync(
  "prisma/migrations/20260717001000_record_classifications/migration.sql",
  "utf8",
);

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  testSchemaEnums();
  testMigrationShape();
  await testResolver();
  await testEntityValidation();
  testLegacyNormalization();
  testNoEnforcementImports();

  console.log("Data quality foundation tests passed.");
}

function testSchemaEnums() {
  const requiredStatuses = [
    "VERIFIED_OFFICIAL",
    "SOURCE_MANAGED_UNVERIFIED",
    "AUDITED_MANUAL",
    "MANUAL_PLACEHOLDER",
    "DEMO",
    "SEED",
    "VALIDATION",
    "UNKNOWN",
    "CONFLICTING",
    "ARCHIVED_HISTORY",
  ];
  const requiredTypes = [
    "SEASON",
    "EVENT",
    "RACE_STAGE",
    "RIDER",
    "TEAM",
    "MANUFACTURER",
    "MOTORCYCLE",
    "RESULT",
    "STAGE_RESULT",
    "RESULT_POINT_COMPONENT",
    "CHAMPIONSHIP_REGULATION",
    "STANDING",
    "STANDING_PUBLICATION",
  ];

  assert.match(schema, /enum DataOriginStatus/);
  assert.match(schema, /enum ClassifiableEntityType/);
  assert.match(schema, /model RecordClassification/);

  for (const status of requiredStatuses) {
    assert.ok(status in DataOriginStatus, `${status} should exist in DataOriginStatus`);
    assert.match(schema, new RegExp(`\\b${status}\\b`));
  }

  for (const type of requiredTypes) {
    assert.ok(
      type in ClassifiableEntityType,
      `${type} should exist in ClassifiableEntityType`,
    );
    assert.match(schema, new RegExp(`\\b${type}\\b`));
  }

  assert.deepEqual([...classifiableEntityTypes], requiredTypes);
  assert.doesNotMatch(schema, /isQuarantined|isTrusted|qualityStatus/);
}

function testMigrationShape() {
  assert.match(migration, /CREATE TYPE "DataOriginStatus"/);
  assert.match(migration, /CREATE TYPE "ClassifiableEntityType"/);
  assert.match(migration, /CREATE TABLE "RecordClassification"/);
  assert.match(migration, /"originStatus" "DataOriginStatus" NOT NULL/);
  assert.match(migration, /"entityType" "ClassifiableEntityType" NOT NULL/);
  assert.match(migration, /"reason" TEXT NOT NULL/);
  assert.match(migration, /"supersededAt" TIMESTAMP\(3\)/);
  assert.match(
    migration,
    /CREATE UNIQUE INDEX "RecordClassification_active_entity_unique"/,
  );
  assert.match(migration, /WHERE "supersededAt" IS NULL/);
  assert.match(migration, /ON DELETE SET NULL ON UPDATE CASCADE/g);
  assert.doesNotMatch(migration, /INSERT INTO "RecordClassification"/);
  assert.doesNotMatch(
    migration,
    /UPDATE "Event"|UPDATE "Result"|UPDATE "SourceLink"|UPDATE "DataVersion"/,
  );
}

async function testResolver() {
  const unclassified = await resolveRecordClassification(
    ClassifiableEntityType.EVENT,
    "event-1",
    createFakeClient([]),
  );
  assert.equal(unclassified.state, "UNCLASSIFIED");
  assert.equal(unclassified.originStatus, null);
  assert.equal(unclassified.explicitlyQuarantined, false);
  assert.equal(unclassified.officialWorkflowEligibility, "UNENFORCED");

  const verified = await resolveRecordClassification(
    ClassifiableEntityType.EVENT,
    "event-1",
    createFakeClient([classification("event-1", DataOriginStatus.VERIFIED_OFFICIAL)]),
  );
  assert.equal(verified.state, "CLASSIFIED");
  assert.equal(verified.explicitlyQuarantined, false);
  assert.equal(verified.officialWorkflowEligibility, "ELIGIBLE");

  const audited = await resolveRecordClassification(
    ClassifiableEntityType.EVENT,
    "event-1",
    createFakeClient([classification("event-1", DataOriginStatus.AUDITED_MANUAL)]),
  );
  assert.equal(audited.officialWorkflowEligibility, "CONDITIONAL");

  const reviewOnly = await resolveRecordClassification(
    ClassifiableEntityType.EVENT,
    "event-1",
    createFakeClient([
      classification("event-1", DataOriginStatus.SOURCE_MANAGED_UNVERIFIED),
    ]),
  );
  assert.equal(reviewOnly.officialWorkflowEligibility, "REVIEW_ONLY");

  for (const status of [
    DataOriginStatus.MANUAL_PLACEHOLDER,
    DataOriginStatus.DEMO,
    DataOriginStatus.SEED,
    DataOriginStatus.VALIDATION,
    DataOriginStatus.UNKNOWN,
    DataOriginStatus.ARCHIVED_HISTORY,
  ]) {
    const resolved = await resolveRecordClassification(
      ClassifiableEntityType.EVENT,
      "event-1",
      createFakeClient([classification("event-1", status)]),
    );
    assert.equal(resolved.explicitlyQuarantined, true);
    assert.equal(resolved.officialWorkflowEligibility, "BLOCKED");
  }

  const conflict = await resolveRecordClassification(
    ClassifiableEntityType.EVENT,
    "event-1",
    createFakeClient([classification("event-1", DataOriginStatus.CONFLICTING)]),
  );
  assert.equal(conflict.explicitlyQuarantined, true);
  assert.equal(conflict.officialWorkflowEligibility, "BLOCKED");

  assert.equal(isExplicitlyQuarantined(DataOriginStatus.DEMO), true);
  assert.equal(isExplicitlyQuarantined(DataOriginStatus.VERIFIED_OFFICIAL), false);
  assert.equal(getOfficialWorkflowEligibility(DataOriginStatus.UNKNOWN), "BLOCKED");

  const active = classification(
    "event-1",
    DataOriginStatus.VERIFIED_OFFICIAL,
    null,
    "active",
  );
  const superseded = classification(
    "event-1",
    DataOriginStatus.DEMO,
    new Date("2026-01-01T00:00:00Z"),
    "old",
  );
  const resolved = await resolveRecordClassification(
    ClassifiableEntityType.EVENT,
    "event-1",
    createFakeClient([superseded, active]),
  );
  assert.equal(resolved.classification?.id, "active");

  const history = await getRecordClassificationHistory(
    ClassifiableEntityType.EVENT,
    "event-1",
    createFakeClient([superseded, active]),
  );
  assert.deepEqual(
    history.map((item) => item.id),
    ["active", "old"],
  );
}

async function testEntityValidation() {
  const fakeClient = createEntityFakeClient();

  for (const entityType of classifiableEntityTypes) {
    const entity = await classifiableEntityExists(
      entityType,
      `${entityType.toLowerCase()}-id`,
      fakeClient,
    );
    assert.equal(entity.exists, true, `${entityType} should exist`);
    assert.ok(entity.label);
  }

  const missing = await classifiableEntityExists(
    ClassifiableEntityType.EVENT,
    "missing-id",
    fakeClient,
  );
  assert.equal(missing.exists, false);

  await assert.rejects(
    () =>
      assertClassifiableEntityExists(
        ClassifiableEntityType.EVENT,
        "missing-id",
        fakeClient,
      ),
    /does not exist/,
  );

  const wrongType = await classifiableEntityExists(
    ClassifiableEntityType.EVENT,
    "race_stage-id",
    fakeClient,
  );
  assert.equal(wrongType.exists, false);

  await assert.rejects(
    () =>
      assertClassifiableEntityExists(
        "UNSUPPORTED" as ClassifiableEntityType,
        "unsupported-id",
        fakeClient,
      ),
    /Unsupported classifiable entity type/,
  );
}

function testLegacyNormalization() {
  assert.equal(normalizeLegacyEntityType("Event"), ClassifiableEntityType.EVENT);
  assert.equal(normalizeLegacyEntityType("EVENT"), ClassifiableEntityType.EVENT);
  assert.equal(normalizeLegacyEntityType("event"), ClassifiableEntityType.EVENT);
  assert.equal(normalizeLegacyEntityType("Result"), ClassifiableEntityType.RESULT);
  assert.equal(normalizeLegacyEntityType("RESULT"), ClassifiableEntityType.RESULT);
  assert.equal(
    normalizeLegacyEntityType("StageResult"),
    ClassifiableEntityType.STAGE_RESULT,
  );
  assert.equal(
    normalizeLegacyEntityType("stage_result"),
    ClassifiableEntityType.STAGE_RESULT,
  );
  assert.equal(
    normalizeLegacyEntityType("ResultPointComponent"),
    ClassifiableEntityType.RESULT_POINT_COMPONENT,
  );
  assert.equal(normalizeLegacyEntityType("not-a-real-type"), null);
}

function testNoEnforcementImports() {
  const filesThatMustRemainBehaviorNeutral = [
    "db/events.ts",
    "db/riders.ts",
    "db/results.ts",
    "db/standings.ts",
    "jobs/connectors/results/overall-matching.ts",
    "jobs/connectors/results/stage-matching.ts",
    "jobs/connectors/results/overall-persistence.ts",
    "jobs/connectors/results/stage-persistence.ts",
    "lib/admin/regulation-component-points.ts",
    "lib/admin/component-points-rollup.ts",
    "lib/admin/standings-calculation.ts",
    "lib/admin/standing-calculation-set-application.ts",
    "lib/admin/standing-publications.ts",
  ];

  for (const file of filesThatMustRemainBehaviorNeutral) {
    const source = readFileSync(join(process.cwd(), file), "utf8");
    assert.doesNotMatch(
      source,
      /data-quality|record-classification|RecordClassification/,
    );
  }
}

function classification(
  entityId: string,
  originStatus: DataOriginStatus,
  supersededAt: Date | null = null,
  id = `${entityId}-${originStatus}`,
) {
  return {
    id,
    entityType: ClassifiableEntityType.EVENT,
    entityId,
    originStatus,
    reason: "Test classification",
    evidence: null,
    sourceLinkId: null,
    sourceSnapshotId: null,
    connectorReviewItemId: null,
    classifiedByUserId: null,
    classifiedByUserEmail: null,
    supersededAt,
    createdAt:
      id === "old" ? new Date("2026-01-01T00:00:00Z") : new Date("2026-01-02T00:00:00Z"),
    updatedAt:
      id === "old" ? new Date("2026-01-01T00:00:00Z") : new Date("2026-01-02T00:00:00Z"),
  };
}

function createFakeClient(rows: ReturnType<typeof classification>[]) {
  return {
    recordClassification: {
      async findFirst({
        where,
      }: {
        where: { entityType: ClassifiableEntityType; entityId: string };
      }) {
        return (
          rows
            .filter(
              (row) =>
                row.entityType === where.entityType &&
                row.entityId === where.entityId &&
                row.supersededAt === null,
            )
            .sort(compareHistory)[0] ?? null
        );
      },
      async findMany({
        where,
      }: {
        where: { entityType: ClassifiableEntityType; entityId: string };
      }) {
        return rows
          .filter(
            (row) =>
              row.entityType === where.entityType && row.entityId === where.entityId,
          )
          .sort(compareHistory);
      },
    },
  } as never;
}

function createEntityFakeClient() {
  const delegate = (label: string) => ({
    async findUnique({ where }: { where: { id: string } }) {
      if (!where.id.startsWith(label)) return null;
      switch (label) {
        case "season":
          return { name: "2026 Season", year: 2026 };
        case "event":
          return { name: "Event" };
        case "race_stage":
          return { name: "Race Stage" };
        case "rider":
          return { firstName: "Test", lastName: "Rider" };
        case "team":
        case "manufacturer":
          return { name: label };
        case "motorcycle":
          return { model: "300 EXC", modelYear: 2026 };
        case "championship_regulation":
          return { title: "Regulation" };
        case "standing_publication":
          return { versionKey: "publication-v1" };
        default:
          return { id: where.id };
      }
    },
  });

  return {
    season: delegate("season"),
    event: delegate("event"),
    raceStage: delegate("race_stage"),
    rider: delegate("rider"),
    team: delegate("team"),
    manufacturer: delegate("manufacturer"),
    motorcycle: delegate("motorcycle"),
    result: delegate("result"),
    stageResult: delegate("stage_result"),
    resultPointComponent: delegate("result_point_component"),
    championshipRegulation: delegate("championship_regulation"),
    standing: delegate("standing"),
    standingPublication: delegate("standing_publication"),
  } as never;
}

function compareHistory(
  left: ReturnType<typeof classification>,
  right: ReturnType<typeof classification>,
) {
  const byCreated = right.createdAt.getTime() - left.createdAt.getTime();
  if (byCreated !== 0) return byCreated;
  return left.id.localeCompare(right.id);
}
