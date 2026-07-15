import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { adminNavItems } from "@/components/admin/admin-nav";
import {
  canManageResults,
  isValidTimingText,
  resultStatuses,
  validateResultCmsInput,
} from "@/lib/admin/result-cms";
import {
  publicResultWhere as publicResultReadWhere,
  publicStageResultWhere as publicStageResultReadWhere,
} from "@/lib/results/public-filters";

testPermissions();
testValidation();
testTimingValidation();
testArchiveSchema();
testPublicArchivedFilters();
testNavigation();
testNoPermanentDeleteSurface();

console.log("Admin results CMS tests passed.");

function testPermissions() {
  assert.equal(canManageResults("owner"), true);
  assert.equal(canManageResults("admin"), true);
  assert.equal(canManageResults("reviewer"), false);
  assert.equal(canManageResults("viewer"), false);
}

function testValidation() {
  const valid = {
    className: "Overall",
    overallPosition: 1,
    classPosition: 1,
    motorcycleId: "clxmotorcycle123",
    manufacturerId: "clxmanufacturer123",
    totalTimeText: "TBC",
    gapToLeaderText: null,
    gapToPreviousText: null,
    status: "FINISHED" as const,
    notes: null,
  };

  assert.deepEqual(resultStatuses, ["FINISHED", "DNF", "DNS", "DSQ", "UNKNOWN"]);
  assert.equal(validateResultCmsInput(valid), null);
  assert.equal(
    validateResultCmsInput({ ...valid, status: "INVALID" as never }),
    "invalid-status",
  );
  assert.equal(
    validateResultCmsInput({ ...valid, overallPosition: 0 }),
    "invalid-overall-position",
  );
  assert.equal(
    validateResultCmsInput({ ...valid, classPosition: 0 }),
    "invalid-class-position",
  );
  assert.equal(
    validateResultCmsInput({
      ...valid,
      status: "DNS",
      overallPosition: 1,
      totalTimeText: null,
    }),
    "dns-position-time",
  );
  assert.equal(
    validateResultCmsInput({
      ...valid,
      status: "DNS",
      overallPosition: null,
      classPosition: null,
      totalTimeText: null,
    }),
    null,
  );
  assert.equal(
    validateResultCmsInput({ ...valid, totalTimeText: "official time someday" }),
    "invalid-total-time",
  );
  assert.equal(
    validateResultCmsInput({ ...valid, gapToLeaderText: "later" }),
    "invalid-gap",
  );
}

function testTimingValidation() {
  assert.equal(isValidTimingText(null), true);
  assert.equal(isValidTimingText("TBC"), true);
  assert.equal(isValidTimingText("1:23:45.678"), true);
  assert.equal(isValidTimingText("+0:03:12"), true);
  assert.equal(isValidTimingText("not a time"), false);
}

function testArchiveSchema() {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  assert.match(schema, /model Result[\s\S]*archivedAt\s+DateTime\?/);
  assert.match(schema, /model Result[\s\S]*archivedBy\s+String\?/);
  assert.match(schema, /model StageResult[\s\S]*archivedAt\s+DateTime\?/);
  assert.match(schema, /model StageResult[\s\S]*archivedBy\s+String\?/);
}

function testPublicArchivedFilters() {
  assert.deepEqual(publicResultReadWhere, { archivedAt: null });
  assert.deepEqual(publicStageResultReadWhere, { archivedAt: null });
  const publicFiles = [
    "db/results.ts",
    "db/events.ts",
    "db/riders.ts",
    "db/teams.ts",
    "db/manufacturers.ts",
    "db/motorcycles.ts",
    "db/statistics.ts",
    "db/records.ts",
    "db/history.ts",
    "db/calculations.ts",
    "db/recalculation.ts",
  ];

  for (const file of publicFiles) {
    const source = readFileSync(file, "utf8");
    assert.match(
      source,
      /publicResultWhere|publicStageResultWhere/,
      `${file} should use public archived-row filtering`,
    );
  }
}

function testNavigation() {
  assert.ok(adminNavItems.some((item) => item.href === "/admin/results"));
  assert.ok(adminNavItems.some((item) => item.href === "/admin/stage-results"));
}

function testNoPermanentDeleteSurface() {
  const resultActions = readFileSync("app/admin/results/actions.ts", "utf8");
  const stageResultActions = readFileSync("app/admin/stage-results/actions.ts", "utf8");
  assert.equal(resultActions.includes("permanentlyDelete"), false);
  assert.equal(stageResultActions.includes("permanentlyDelete"), false);
}
