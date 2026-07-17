import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseComponentEventFormats,
  parseComponentPointsTables,
  validateOfficialRegulation,
} from "@/lib/regulations/championship-regulations";

testEventFormatParsing();
testEventFormatValidation();
testRollupServiceArchitecture();
testRollupApplyIsolation();
testRollupPermissionBoundary();

console.log("Component points rollup tests passed.");

function testEventFormatParsing() {
  const mapping = {
    tables: [
      {
        key: "prologue",
        componentType: "PROLOGUE",
        positions: [{ position: 1, points: 3 }],
      },
      {
        key: "sprint",
        componentType: "SPRINT",
        positions: [{ position: 1, points: 10 }],
      },
      {
        key: "main_event",
        componentType: "MAIN_EVENT",
        inputMode: "RESULT",
        positions: [{ position: 1, points: 20 }],
      },
      {
        key: "final",
        componentType: "FINAL",
        positions: [{ position: 1, points: 20 }],
      },
    ],
    eventFormats: [
      {
        key: "prologue-main-or-final",
        eventSlugs: ["erzbergrodeo-2026"],
        requiredTables: ["prologue"],
        optionalTables: ["sprint"],
        oneOf: [["main_event", "final"]],
        maximumPoints: 33,
      },
    ],
  };
  assert.equal(parseComponentPointsTables(mapping).length, 4);
  assert.deepEqual(parseComponentEventFormats(mapping), [
    {
      key: "prologue-main-or-final",
      eventIds: [],
      eventSlugs: ["erzbergrodeo-2026"],
      requiredTables: ["prologue"],
      optionalTables: ["sprint"],
      oneOf: [["main_event", "final"]],
      maximumPoints: 33,
    },
  ]);
}

function testEventFormatValidation() {
  const issues = validateOfficialRegulation({
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
          key: "prologue",
          componentType: "PROLOGUE",
          positions: [{ position: 1, points: 0 }],
        },
      ],
      eventFormats: [
        {
          key: "invalid",
          requiredTables: ["prologue"],
          optionalTables: ["prologue"],
          oneOf: [["missing_table"]],
          maximumPoints: -1,
        },
      ],
    },
    tieBreakRules: [
      {
        type: "wins",
        order: 1,
        description: "Most wins",
        section: "Article 060.9",
      },
    ],
  });
  assert.equal(
    issues.some((issue) => issue.code === "invalid-component-table"),
    true,
  );
}

function testRollupServiceArchitecture() {
  const service = readFileSync("lib/admin/component-points-rollup.ts", "utf8");
  assert.match(service, /official-component-points-rollup/);
  assert.match(service, /tx\.connectorSnapshot\.create/);
  assert.match(service, /payloadChecksum/);
  assert.match(service, /suggestedAction: row\.action/);
  assert.match(service, /RESULT_INVALID/);
  assert.match(service, /UPDATE_RESULT/);
  assert.match(service, /result\.points === proposedPoints\s+\? null/);
  assert.match(service, /component\.connectorReviewItem/);
  assert.match(service, /appliedResultPointComponentId !== component\.id/);
  assert.match(service, /sourceLinkIds\.length === 0/);
  assert.match(service, /dataVersionIds\.length === 0/);
  assert.match(service, /maximumPoints/);
  assert.doesNotMatch(service, /result\.update\(/);
  assert.doesNotMatch(service, /standing\./i);
}

function testRollupApplyIsolation() {
  const apply = readFileSync("lib/admin/connector-review-application.ts", "utf8");
  assert.match(apply, /componentPointsRollupConnectorKey/);
  assert.match(apply, /payloadType !== "component-points-rollup"/);
  assert.match(apply, /context\.changedFields\.length !== 1/);
  assert.match(apply, /Only FINISHED Results can receive component rollup points/);
  assert.match(apply, /Rollup component SourceLink lineage is missing/);
  assert.match(apply, /Rollup component DataVersion lineage is missing/);
  assert.match(apply, /Proposed Result\.points no longer matches component rollup/);
  assert.match(apply, /Rollup total exceeds maximum event points/);
  assert.match(apply, /Component points rollup scoring derivation/);
  assert.match(apply, /tx\.sourceLink\.findFirst/);
  assert.doesNotMatch(apply, /standing\.update\([^)]*component rollup/s);
}

function testRollupPermissionBoundary() {
  const actions = readFileSync("app/admin/regulations/actions.ts", "utf8");
  assert.match(actions, /createComponentRollupReview/);
  assert.match(actions, /hasPermission\(session, "calculations:review"\)/);
  const reviewActions = readFileSync("app/admin/review/actions.ts", "utf8");
  assert.match(reviewActions, /hasPermission\(session, "review:approve"\)/);
}
