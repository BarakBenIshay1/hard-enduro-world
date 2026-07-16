import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { previewStandingsCalculation } from "@/jobs/calculations/standings-engine";
import {
  stableHash,
  standingsCalculationVersion,
  standingsConnectorKey,
} from "@/lib/admin/standings-calculation";
import { validateConnectorReviewApplicationPolicy } from "@/lib/admin/connector-review-application";
import type { CalculationResultInput } from "@/jobs/calculations/validation";

testExistingArchitecture();
testCalculationDeterminism();
testSourcePointsOnlyAndStatusHandling();
testClassIsolation();
testUnresolvedTieBlocksApply();
testMissingSourcePointsBlocksApply();
testStandingApplyPolicy();
testReviewSchemaLinkage();

console.log("Admin standings workflow tests passed.");

function testExistingArchitecture() {
  assert.equal(standingsConnectorKey, "standings-calculation");
  assert.equal(standingsCalculationVersion, "standings-calculation-v1");
}

function testCalculationDeterminism() {
  const preview = previewStandingsCalculation({
    results: [
      input({ id: "result-1", riderId: "rider-a", points: 20, position: 1 }),
      input({
        id: "result-2",
        riderId: "rider-b",
        riderName: "Rider B",
        points: 17,
        position: 2,
      }),
      input({
        id: "result-3",
        eventId: "event-2",
        riderId: "rider-b",
        riderName: "Rider B",
        points: 20,
        position: 1,
      }),
    ],
    currentStandings: [],
    pointsSystemId: "source-result-points",
  });

  assert.equal(preview.validationIssues.length, 0);
  assert.equal(preview.standings[0].riderId, "rider-b");
  assert.equal(preview.standings[0].proposedPoints, 37);
  assert.equal(preview.standings[1].proposedPoints, 20);
  assert.equal(stableHash({ b: 1, a: ["x", "y"] }), stableHash({ a: ["x", "y"], b: 1 }));
}

function testSourcePointsOnlyAndStatusHandling() {
  const preview = previewStandingsCalculation({
    results: [
      input({
        id: "finished",
        riderId: "rider-a",
        points: 9,
        status: "FINISHED",
        position: 4,
      }),
      input({ id: "dnf", riderId: "rider-a", points: 2, status: "DNF", position: null }),
      input({ id: "dns", riderId: "rider-a", points: 1, status: "DNS", position: null }),
      input({
        id: "dsq",
        riderId: "rider-b",
        riderName: "Rider B",
        points: 0,
        status: "DSQ",
        position: null,
      }),
      input({
        id: "unknown",
        riderId: "rider-b",
        riderName: "Rider B",
        points: 99,
        status: "UNKNOWN",
        position: null,
      }),
    ],
    currentStandings: [],
    pointsSystemId: "source-result-points",
  });

  const riderA = preview.standings.find((row) => row.riderId === "rider-a");
  const riderB = preview.standings.find((row) => row.riderId === "rider-b");
  assert.equal(riderA?.proposedPoints, 12);
  assert.equal(riderA?.starts, 2);
  assert.equal(riderA?.dnfs, 1);
  assert.equal(riderA?.wins, 0);
  assert.equal(riderA?.podiums, 0);
  assert.equal(riderB?.proposedPoints, 0);
}

function testClassIsolation() {
  const preview = previewStandingsCalculation({
    results: [
      input({ id: "pro-a", riderId: "rider-a", className: "Pro", points: 20 }),
      input({ id: "expert-a", riderId: "rider-a", className: "Expert", points: 5 }),
      input({
        id: "pro-b",
        riderId: "rider-b",
        riderName: "Rider B",
        className: "Pro",
        points: 17,
      }),
    ],
    currentStandings: [],
    pointsSystemId: "source-result-points",
  });

  assert.equal(preview.standings.length, 3);
  assert.equal(
    preview.standings.find((row) => row.riderId === "rider-a" && row.className === "Pro")
      ?.proposedPoints,
    20,
  );
  assert.equal(
    preview.standings.find(
      (row) => row.riderId === "rider-a" && row.className === "Expert",
    )?.proposedPoints,
    5,
  );
  assert.equal(
    preview.standings.find(
      (row) => row.riderId === "rider-a" && row.className === "Expert",
    )?.proposedPosition,
    1,
  );
}

function testUnresolvedTieBlocksApply() {
  const preview = previewStandingsCalculation({
    results: [
      input({ id: "tie-a", riderId: "rider-a", riderName: "Rider A", points: 20 }),
      input({ id: "tie-b", riderId: "rider-b", riderName: "Rider B", points: 20 }),
    ],
    currentStandings: [],
    pointsSystemId: "source-result-points",
  });

  assert.equal(
    preview.validationIssues.some((issue) => issue.code === "unresolved-tie"),
    true,
  );
}

function testMissingSourcePointsBlocksApply() {
  const preview = previewStandingsCalculation({
    results: [input({ id: "missing-points", points: null })],
    currentStandings: [],
    pointsSystemId: "source-result-points",
  });

  assert.equal(
    preview.validationIssues.some(
      (issue) => issue.code === "missing-points" && issue.severity === "error",
    ),
    true,
  );
}

function testStandingApplyPolicy() {
  const proposed = {
    entityType: "Standing",
    seasonId: "season-2026",
    riderId: "rider-a",
    riderName: "Rider A",
    className: null,
    position: 1,
    points: 20,
    wins: 1,
    podiums: 1,
    starts: 1,
    dnfs: 0,
    pointsSystemId: "source-result-points",
    calculationVersion: standingsCalculationVersion,
    inputResultIds: ["result-1"],
    applyEligible: true,
  };

  assert.deepEqual(
    validateConnectorReviewApplicationPolicy({
      reviewStatus: "APPROVED",
      applicationStatus: "NOT_APPLIED",
      suggestedAction: "NEW_STANDING",
      changedFields: [
        "standing",
        "seasonId",
        "riderId",
        "position",
        "points",
        "wins",
        "podiums",
        "starts",
        "dnfs",
      ],
      proposedValues: proposed,
    }),
    { ok: true },
  );

  const blocked = validateConnectorReviewApplicationPolicy({
    reviewStatus: "APPROVED",
    applicationStatus: "NOT_APPLIED",
    suggestedAction: "NEW_STANDING",
    changedFields: ["position"],
    proposedValues: { ...proposed, applyEligible: false },
  });
  assert.equal(blocked.ok, false);

  const unsupportedPointsSource = validateConnectorReviewApplicationPolicy({
    reviewStatus: "APPROVED",
    applicationStatus: "NOT_APPLIED",
    suggestedAction: "NEW_STANDING",
    changedFields: ["position"],
    proposedValues: { ...proposed, pointsSystemId: "fim-style" },
  });
  assert.equal(unsupportedPointsSource.ok, false);

  const unsupported = validateConnectorReviewApplicationPolicy({
    reviewStatus: "APPROVED",
    applicationStatus: "NOT_APPLIED",
    suggestedAction: "NEW_STANDING",
    changedFields: ["position", "overallPosition"],
    proposedValues: proposed,
  });
  assert.equal(unsupported.ok, false);
}

function testReviewSchemaLinkage() {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  assert.match(schema, /NEW_STANDING/);
  assert.match(schema, /UPDATE_STANDING/);
  assert.match(schema, /UNCHANGED_STANDING/);
  assert.match(schema, /currentStandingId\s+String\?/);
  assert.match(schema, /appliedStandingId\s+String\?/);
}

function input(overrides: Partial<CalculationResultInput> = {}): CalculationResultInput {
  return {
    id: "result",
    seasonId: "season-2026",
    eventId: "event-1",
    riderId: "rider-a",
    riderName: "Rider A",
    className: null,
    position: 1,
    points: 20,
    status: "FINISHED",
    ...overrides,
  };
}
