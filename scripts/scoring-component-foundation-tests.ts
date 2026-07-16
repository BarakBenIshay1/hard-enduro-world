import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ScoringComponentType, StageType } from "@prisma/client";
import { adminNavItems } from "@/components/admin/admin-nav";
import { pointsSystems } from "@/jobs/calculations/points-system";

testStageTypes();
testResultPointComponentSchema();
testMigrationSafety();
testAdminReadSupport();
testComponentReviewPipelineArchitecture();
testExistingStandingsContract();

console.log("Scoring component foundation tests passed.");

function testStageTypes() {
  assert.ok(Object.values(StageType).includes("SPRINT"));
  assert.ok(Object.values(StageType).includes("MAIN_EVENT"));
  assert.deepEqual(Object.values(ScoringComponentType), [
    "PROLOGUE",
    "SPRINT",
    "MAIN_EVENT",
    "FINAL",
    "OTHER",
  ]);
}

function testResultPointComponentSchema() {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  assert.match(schema, /model ResultPointComponent \{/);
  assert.match(schema, /resultId\s+String/);
  assert.match(schema, /stageResultId\s+String\?/);
  assert.match(schema, /raceStageId\s+String\?/);
  assert.match(schema, /componentType\s+ScoringComponentType/);
  assert.match(schema, /classificationScope\s+String\s+@default\("OVERALL"\)/);
  assert.match(schema, /className\s+String\?/);
  assert.match(schema, /position\s+Int\?/);
  assert.match(schema, /points\s+Int/);
  assert.match(schema, /regulationId\s+String/);
  assert.match(schema, /regulationVersion\s+Int/);
  assert.match(schema, /regulationChecksum\s+String/);
  assert.match(schema, /regulationTableKey\s+String/);
  assert.match(schema, /sourceSnapshotId\s+String\?/);
  assert.match(schema, /connectorReviewItemId\s+String\?/);
  assert.match(schema, /officialRawPayload\s+Json\?/);
  assert.match(schema, /archivedAt\s+DateTime\?/);
  assert.match(schema, /result\s+Result\s+@relation/);
  assert.match(schema, /stageResult\s+StageResult\?\s+@relation/);
  assert.match(schema, /raceStage\s+RaceStage\?\s+@relation/);
  assert.match(schema, /regulation\s+ChampionshipRegulation\s+@relation/);
  assert.match(schema, /sourceSnapshot\s+SourceSnapshot\?\s+@relation/);
  assert.match(schema, /connectorReviewItem\s+ConnectorReviewItem\?\s+@relation/);
  assert.match(schema, /model Result[\s\S]*pointComponents\s+ResultPointComponent\[\]/);
  assert.match(
    schema,
    /model StageResult[\s\S]*pointComponents\s+ResultPointComponent\[\]/,
  );
  assert.match(
    schema,
    /model RaceStage[\s\S]*pointComponents\s+ResultPointComponent\[\]/,
  );
  assert.match(
    schema,
    /model ChampionshipRegulation[\s\S]*resultPointComponents\s+ResultPointComponent\[\]/,
  );
}

function testMigrationSafety() {
  const migration = readFileSync(
    "prisma/migrations/20260716003000_scoring_component_foundation/migration.sql",
    "utf8",
  );
  assert.match(migration, /ALTER TYPE "StageType" ADD VALUE IF NOT EXISTS 'SPRINT'/);
  assert.match(migration, /ALTER TYPE "StageType" ADD VALUE IF NOT EXISTS 'MAIN_EVENT'/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "ResultPointComponent"/);
  assert.match(migration, /"ResultPointComponent_active_component_unique"/);
  assert.match(migration, /WHERE "archivedAt" IS NULL/);
  assert.doesNotMatch(migration, /\bDROP\s+TABLE\b/i);
  assert.doesNotMatch(migration, /\bDELETE\s+FROM\b/i);
  assert.doesNotMatch(migration, /\bUPDATE\s+"?(Result|StageResult|Standing)"?\b/i);

  const reviewActionMigration = readFileSync(
    "prisma/migrations/20260716014500_result_point_component_review_actions/migration.sql",
    "utf8",
  );
  for (const action of [
    "NEW_RESULT_POINT_COMPONENT",
    "UPDATE_RESULT_POINT_COMPONENT",
    "RESULT_POINT_COMPONENT_CONFLICT",
    "RESULT_POINT_COMPONENT_UNRESOLVED",
    "RESULT_POINT_COMPONENT_INVALID",
    "RESULT_POINT_COMPONENT_MISSING_SOURCE",
  ]) {
    assert.match(reviewActionMigration, new RegExp(action));
  }
}

function testAdminReadSupport() {
  assert.ok(adminNavItems.some((item) => item.href === "/admin/result-point-components"));
  const listPage = readFileSync("app/admin/result-point-components/page.tsx", "utf8");
  const detailPage = readFileSync(
    "app/admin/result-point-components/[id]/page.tsx",
    "utf8",
  );
  const repository = readFileSync("db/admin-result-point-components.ts", "utf8");

  assert.match(listPage, /getAdminResultPointComponents/);
  assert.match(detailPage, /getAdminResultPointComponentDetail/);
  assert.match(detailPage, /VersionTimeline/);
  assert.match(repository, /entityType: "ResultPointComponent"/);
  assert.match(repository, /dataVersion\.findMany/);
  assert.match(repository, /sourceLink\.findMany/);
  assert.doesNotMatch(
    listPage + detailPage,
    /from "@\/app\/admin\/result-point-components\/actions"/,
  );
  assert.doesNotMatch(listPage + detailPage, /<form\s+action=/);
}

function testComponentReviewPipelineArchitecture() {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const service = readFileSync("lib/admin/regulation-component-points.ts", "utf8");
  const applyService = readFileSync("lib/admin/connector-review-application.ts", "utf8");
  const regulationActions = readFileSync("app/admin/regulations/actions.ts", "utf8");

  for (const action of [
    "NEW_RESULT_POINT_COMPONENT",
    "UPDATE_RESULT_POINT_COMPONENT",
    "RESULT_POINT_COMPONENT_CONFLICT",
    "RESULT_POINT_COMPONENT_UNRESOLVED",
    "RESULT_POINT_COMPONENT_INVALID",
    "RESULT_POINT_COMPONENT_MISSING_SOURCE",
  ]) {
    assert.match(schema, new RegExp(action));
  }

  assert.match(service, /parseComponentPointsTables/);
  assert.match(service, /regulationComponentPointsConnectorKey/);
  assert.match(service, /inputAuthorityType/);
  assert.match(service, /inputResultSourceSnapshotId/);
  assert.match(service, /inputDataVersionId/);
  assert.match(service, /RESULT_POINT_COMPONENT_MISSING_SOURCE/);
  assert.match(service, /resultPointComponent\.findMany/);
  assert.doesNotMatch(service, /resultPointComponent\.create/);
  assert.doesNotMatch(service, /\bstanding\.(create|update|updateMany)\(/);
  assert.doesNotMatch(service, /\bresult\.update\(/);

  assert.match(applyService, /applyResultPointComponentReviewItem/);
  assert.match(applyService, /createResultPointComponentSourceLink/);
  assert.match(applyService, /entityType: "ResultPointComponent"/);
  assert.match(applyService, /appliedResultPointComponentId/);
  assert.match(applyService, /validateResultPointComponentApplyContext/);

  assert.match(regulationActions, /createRegulationComponentPointsReviewRun/);
}

function testExistingStandingsContract() {
  assert.deepEqual(pointsSystems, [
    {
      id: "source-result-points",
      name: "Source Result points",
      description:
        "Uses points already stored on persisted Result rows. No position-to-points table is inferred.",
    },
  ]);
  const standingsEngine = readFileSync("jobs/calculations/standings-engine.ts", "utf8");
  assert.match(standingsEngine, /pointsSystemId = "source-result-points"/);
  assert.doesNotMatch(standingsEngine, /ResultPointComponent/);
}
