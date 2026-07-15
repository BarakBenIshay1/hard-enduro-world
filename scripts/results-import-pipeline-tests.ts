import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getErzbergrodeoOverallResultsConfig,
  normalizeOverallResultRows,
  parseOverallResultsCsv,
} from "@/jobs/connectors/results/official-erzbergrodeo-overall";
import { matchOverallResultProposals } from "@/jobs/connectors/results/overall-matching";
import { createReviewDeduplicationKey } from "@/jobs/connectors/results/overall-persistence";
import {
  assertNoStaleChangedFields,
  validateConnectorReviewApplicationPolicy,
} from "@/lib/admin/connector-review-application";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

async function main() {
  await test("official fixture parses verified overall rows without invented timing", () => {
    const raw = readFixture();
    const rows = parseOverallResultsCsv(raw);
    assert.equal(rows.length, 6);
    assert.equal(rows[0]?.riderName, "Manuel Lettenbichler");
    assert.equal(rows[3]?.riderName, "Teodor Kabakchiev");
    assert.equal(rows[5]?.position, 7);
    assert.equal(rows[0]?.totalTimeText, null);
    assert.equal(rows[0]?.status, "FINISHED");
  });

  await test("normalization preserves null unknown values", () => {
    const rows = parseOverallResultsCsv(readFixture());
    const normalized = normalizeOverallResultRows({
      rows,
      config: getErzbergrodeoOverallResultsConfig(),
    });
    assert.equal(normalized[1]?.gapToLeaderText, null);
    assert.equal(normalized[1]?.motorcycle, null);
    assert.equal(normalized[1]?.position, 2);
  });

  await test("event and rider matching resolves deterministic slug matches", async () => {
    const [proposal] = normalizeOverallResultRows({
      rows: parseOverallResultsCsv(readFixture()).slice(0, 1),
      config: getErzbergrodeoOverallResultsConfig(),
    });
    const [matched] = await matchOverallResultProposals([proposal!], fakePrisma());
    assert.equal(matched?.eventId, "event-erzberg");
    assert.equal(matched?.riderId, "rider-mani");
    assert.equal(matched?.reviewAction, "NEW_RESULT");
    assert.equal(matched?.applyEligible, true);
  });

  await test("unresolved required rider blocks apply", async () => {
    const [proposal] = normalizeOverallResultRows({
      rows: parseOverallResultsCsv(readFixture()).slice(0, 1),
      config: getErzbergrodeoOverallResultsConfig(),
    });
    const [matched] = await matchOverallResultProposals(
      [{ ...proposal!, riderSlug: "missing-rider", riderName: "Missing Rider" }],
      fakePrisma({ riderMissing: true }),
    );
    assert.equal(matched?.reviewAction, "RESULT_UNRESOLVED");
    assert.equal(matched?.applyEligible, false);
  });

  await test("changed existing result creates UPDATE_RESULT proposal", async () => {
    const [proposal] = normalizeOverallResultRows({
      rows: parseOverallResultsCsv(readFixture()).slice(0, 1),
      config: getErzbergrodeoOverallResultsConfig(),
    });
    const [matched] = await matchOverallResultProposals(
      [proposal!],
      fakePrisma({ existingPosition: 2 }),
    );
    assert.equal(matched?.reviewAction, "UPDATE_RESULT");
    assert.deepEqual(matched?.changedFields, ["overallPosition"]);
  });

  await test("unchanged existing result does not require actionable proposal", async () => {
    const [proposal] = normalizeOverallResultRows({
      rows: parseOverallResultsCsv(readFixture()).slice(0, 1),
      config: getErzbergrodeoOverallResultsConfig(),
    });
    const [matched] = await matchOverallResultProposals(
      [proposal!],
      fakePrisma({ existingPosition: 1 }),
    );
    assert.equal(matched?.reviewAction, "UNCHANGED");
    assert.deepEqual(matched?.changedFields, []);
  });

  await test("review deduplication key is stable for identical proposals", async () => {
    const [proposal] = normalizeOverallResultRows({
      rows: parseOverallResultsCsv(readFixture()).slice(0, 1),
      config: getErzbergrodeoOverallResultsConfig(),
    });
    const [matched] = await matchOverallResultProposals([proposal!], fakePrisma());
    assert.equal(
      createReviewDeduplicationKey(matched!),
      createReviewDeduplicationKey(matched!),
    );
  });

  await test("approved result policy accepts only eligible result proposals", () => {
    const result = validateConnectorReviewApplicationPolicy({
      reviewStatus: "APPROVED",
      applicationStatus: "NOT_APPLIED",
      suggestedAction: "NEW_RESULT",
      changedFields: ["result"],
      proposedValues: {
        entityType: "Result",
        sourceRowId: "row-1",
        sourceId: "source",
        eventId: "event",
        riderId: "rider",
        manufacturerId: null,
        motorcycleId: null,
        className: "Overall",
        overallPosition: 1,
        status: "FINISHED",
        totalTimeText: null,
        gapToLeaderText: null,
        gapToPreviousText: null,
        officialRawRow: {},
        officialSourceUrl: "https://example.com",
        eventSlug: "erzbergrodeo-2026",
        eventName: "Red Bull Erzbergrodeo",
        riderSlug: "manuel-lettenbichler",
        riderName: "Manuel Lettenbichler",
        manufacturer: "KTM",
        motorcycle: null,
        team: null,
        entityMatches: [],
        validationWarnings: [],
        applyEligible: true,
      },
    });
    assert.equal(result.ok, true);
  });

  await test("invalid status blocks result apply policy", () => {
    const result = validateConnectorReviewApplicationPolicy({
      reviewStatus: "APPROVED",
      applicationStatus: "NOT_APPLIED",
      suggestedAction: "NEW_RESULT",
      changedFields: ["result"],
      proposedValues: {
        entityType: "Result",
        sourceRowId: "row-1",
        sourceId: "source",
        eventId: "event",
        riderId: "rider",
        status: "MAYBE",
        applyEligible: true,
      },
    });
    assert.equal(result.ok, false);
  });

  await test("stale result state is rejected before apply", () => {
    assert.throws(
      () =>
        assertNoStaleChangedFields({
          entityLabel: "Result",
          changedFields: ["overallPosition"],
          aggregateField: "result",
          previousState: { overallPosition: 3 },
          expectedState: { overallPosition: 2 },
        }),
      /Stale Result state for overallPosition/,
    );
    assert.doesNotThrow(() =>
      assertNoStaleChangedFields({
        entityLabel: "Result",
        changedFields: ["overallPosition"],
        aggregateField: "result",
        previousState: { overallPosition: 2 },
        expectedState: { overallPosition: 2 },
      }),
    );
  });

  console.log("Results import pipeline tests passed.");
}

function readFixture() {
  return readFileSync(
    path.join(
      projectRoot,
      "jobs/connectors/results/fixtures/erzbergrodeo-2026-overall-results.csv",
    ),
    "utf8",
  );
}

function fakePrisma({
  riderMissing = false,
  existingPosition = null,
}: {
  riderMissing?: boolean;
  existingPosition?: number | null;
} = {}) {
  return {
    event: {
      findUnique: async ({ where }: { where: { slug?: string; id?: string } }) =>
        where.slug === "erzbergrodeo-2026" || where.id === "event-erzberg"
          ? { id: "event-erzberg" }
          : null,
      findFirst: async () => null,
    },
    rider: {
      findUnique: async ({ where }: { where: { slug?: string; id?: string } }) =>
        !riderMissing &&
        (where.slug === "manuel-lettenbichler" || where.id === "rider-mani")
          ? { id: "rider-mani" }
          : null,
      findFirst: async () => null,
    },
    manufacturer: {
      findFirst: async () => ({ id: "manufacturer-ktm" }),
      findUnique: async () => ({ id: "manufacturer-ktm" }),
    },
    motorcycle: {
      findFirst: async () => null,
      findUnique: async () => null,
    },
    team: {
      findFirst: async () => null,
    },
    result: {
      findFirst: async () =>
        existingPosition === null
          ? null
          : {
              id: "result-existing",
              eventId: "event-erzberg",
              riderId: "rider-mani",
              motorcycleId: null,
              manufacturerId: "manufacturer-ktm",
              className: "Overall",
              overallPosition: existingPosition,
              status: "FINISHED",
              totalTimeText: null,
              gapToLeaderText: null,
              gapToPreviousText: null,
            },
    },
  } as never;
}

async function test(name: string, callback: () => void | Promise<void>) {
  await callback();
  console.log(`✓ ${name}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
