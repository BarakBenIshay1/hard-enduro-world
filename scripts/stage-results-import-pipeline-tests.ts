import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getErzbergrodeoStageResultsConfig,
  normalizeStageResultRows,
  parseDurationMs,
  parseStageResultsCsv,
} from "@/jobs/connectors/results/official-erzbergrodeo-stage";
import {
  appendMissingSourceStageResultWarnings,
  matchStageResultProposals,
  resolveStage,
} from "@/jobs/connectors/results/stage-matching";
import { createStageReviewDeduplicationKey } from "@/jobs/connectors/results/stage-persistence";
import {
  assertNoStaleChangedFields,
  validateConnectorReviewApplicationPolicy,
} from "@/lib/admin/connector-review-application";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

async function main() {
  await test("null-preserving stage parsing", () => {
    const rows = parseStageResultsCsv(readFixture());
    assert.equal(rows.length, 6);
    assert.equal(rows[0]?.sourceStageName, "Main Race");
    assert.equal(rows[3]?.riderName, "Teodor Kabakchiev");
    assert.equal(rows[5]?.position, 7);
    assert.equal(rows[0]?.totalTimeText, null);
    assert.equal(rows[0]?.status, "FINISHED");
  });

  await test("stage normalization preserves null timing", () => {
    const normalized = normalizeStageResultRows({
      rows: parseStageResultsCsv(readFixture()),
      config: getErzbergrodeoStageResultsConfig(),
    });
    assert.equal(normalized[0]?.totalTimeText, null);
    assert.equal(normalized[0]?.totalTimeMs, null);
    assert.equal(normalized[0]?.className, "Pro");
  });

  await test("source stage ID alias matching", async () => {
    const [proposal] = normalizedFixture();
    const stage = await resolveStage(proposal!, "event-erzberg", fakePrisma());
    assert.equal(stage.matchedId, "stage-final");
    assert.equal(stage.method, "explicit-alias");
  });

  await test("exact stage slug matching", async () => {
    const [proposal] = normalizedFixture();
    const stage = await resolveStage(
      { ...proposal!, sourceStageId: null, sourceStageName: null },
      "event-erzberg",
      fakePrisma(),
    );
    assert.equal(stage.matchedId, "stage-final");
    assert.equal(stage.method, "exact-slug");
  });

  await test("event plus stage-order matching", async () => {
    const [proposal] = normalizedFixture();
    const stage = await resolveStage(
      { ...proposal!, sourceStageId: null, sourceStageName: null, stageSlug: null },
      "event-erzberg",
      fakePrisma(),
    );
    assert.equal(stage.matchedId, "stage-final");
    assert.equal(stage.method, "event-stage-order");
  });

  await test("ambiguous stage matching blocks apply", async () => {
    const [proposal] = normalizedFixture();
    const stage = await resolveStage(
      { ...proposal!, sourceStageId: null, stageSlug: null, sourceStageName: "Final" },
      "event-erzberg",
      fakePrisma({ ambiguousStageName: true }),
    );
    assert.equal(stage.method, "ambiguous");
  });

  await test("new StageResult proposal resolves rider and equipment", async () => {
    const [matched] = await matchStageResultProposals(normalizedFixture(), fakePrisma());
    assert.equal(matched?.reviewAction, "NEW_STAGE_RESULT");
    assert.equal(matched?.applyEligible, true);
    assert.equal(matched?.stageId, "stage-final");
    assert.equal(matched?.riderId, "rider-mani");
  });

  await test("updated StageResult proposal detects field diff", async () => {
    const [matched] = await matchStageResultProposals(
      normalizedFixture(),
      fakePrisma({ existingPosition: 2 }),
    );
    assert.equal(matched?.reviewAction, "UPDATE_STAGE_RESULT");
    assert.deepEqual(matched?.changedFields, ["overallPosition"]);
  });

  await test("unchanged StageResult has no actionable proposal", async () => {
    const [matched] = await matchStageResultProposals(
      normalizedFixture(),
      fakePrisma({ existingPosition: 1 }),
    );
    assert.equal(matched?.reviewAction, "UNCHANGED");
    assert.deepEqual(matched?.changedFields, []);
  });

  await test("unresolved RaceStage blocks apply", async () => {
    const [proposal] = normalizedFixture();
    const [matched] = await matchStageResultProposals(
      [
        {
          ...proposal!,
          sourceStageId: "missing",
          sourceStageName: null,
          stageSlug: "missing",
          stageOrder: 99,
        },
      ],
      fakePrisma(),
    );
    assert.equal(matched?.reviewAction, "STAGE_RESULT_UNRESOLVED");
    assert.equal(matched?.applyEligible, false);
  });

  await test("invalid stage position blocks apply", async () => {
    const [proposal] = normalizedFixture();
    const [matched] = await matchStageResultProposals(
      [{ ...proposal!, position: 0 }],
      fakePrisma(),
    );
    assert.equal(matched?.reviewAction, "STAGE_RESULT_INVALID");
  });

  await test("DNF DNS DSQ UNKNOWN statuses are accepted", async () => {
    for (const status of ["DNF", "DNS", "DSQ", "UNKNOWN"] as const) {
      const [proposal] = normalizedFixture();
      const [matched] = await matchStageResultProposals(
        [{ ...proposal!, status, position: status === "DNS" ? null : 1 }],
        fakePrisma(),
      );
      assert.notEqual(matched?.reviewAction, "STAGE_RESULT_INVALID");
    }
  });

  await test("invalid stage time is detected", async () => {
    assert.equal(Number.isNaN(parseDurationMs("not-time")), true);
    const [proposal] = normalizedFixture();
    const [matched] = await matchStageResultProposals(
      [{ ...proposal!, totalTimeText: "not-time", totalTimeMs: Number.NaN }],
      fakePrisma(),
    );
    assert.equal(matched?.reviewAction, "STAGE_RESULT_INVALID");
  });

  await test("stage review deduplication key is stable", async () => {
    const [matched] = await matchStageResultProposals(normalizedFixture(), fakePrisma());
    assert.equal(
      createStageReviewDeduplicationKey(matched!),
      createStageReviewDeduplicationKey(matched!),
    );
  });

  await test("approved stage result policy accepts eligible proposals", async () => {
    const [matched] = await matchStageResultProposals(normalizedFixture(), fakePrisma());
    const result = validateConnectorReviewApplicationPolicy({
      reviewStatus: "APPROVED",
      applicationStatus: "NOT_APPLIED",
      suggestedAction: "NEW_STAGE_RESULT",
      changedFields: matched!.changedFields,
      proposedValues: matched!.proposedValues,
    });
    assert.equal(result.ok, true);
  });

  await test("blocked stage result policy rejects unresolved proposals", async () => {
    const [proposal] = normalizedFixture();
    const [matched] = await matchStageResultProposals(
      [{ ...proposal!, riderSlug: "missing-rider", riderName: "Missing Rider" }],
      fakePrisma({ riderMissing: true }),
    );
    const result = validateConnectorReviewApplicationPolicy({
      reviewStatus: "APPROVED",
      applicationStatus: "NOT_APPLIED",
      suggestedAction: "NEW_STAGE_RESULT",
      changedFields: matched!.changedFields,
      proposedValues: matched!.proposedValues,
    });
    assert.equal(result.ok, false);
  });

  await test("source-managed StageResult absent from newest source creates warning", async () => {
    const rows = await matchStageResultProposals(normalizedFixture(), fakePrisma());
    const withWarnings = await appendMissingSourceStageResultWarnings({
      rows,
      config: getErzbergrodeoStageResultsConfig(),
      client: fakePrisma({ sourceManagedMissing: true }),
    });
    const warning = withWarnings.find(
      (row) => row.reviewAction === "STAGE_RESULT_MISSING_SOURCE",
    );
    assert.ok(warning);
    assert.equal(warning.applyEligible, false);
    assert.equal(warning.currentStageResultId, "stage-result-missing");
    assert.equal(warning.currentValues?.overallPosition, 9);
  });

  await test("missing-source warning dedupe key is stable across identical runs", async () => {
    const rows = await matchStageResultProposals(normalizedFixture(), fakePrisma());
    const first = await appendMissingSourceStageResultWarnings({
      rows,
      config: getErzbergrodeoStageResultsConfig(),
      client: fakePrisma({ sourceManagedMissing: true }),
    });
    const second = await appendMissingSourceStageResultWarnings({
      rows,
      config: getErzbergrodeoStageResultsConfig(),
      client: fakePrisma({ sourceManagedMissing: true }),
    });
    const firstWarning = first.find(
      (row) => row.reviewAction === "STAGE_RESULT_MISSING_SOURCE",
    );
    const secondWarning = second.find(
      (row) => row.reviewAction === "STAGE_RESULT_MISSING_SOURCE",
    );
    assert.ok(firstWarning);
    assert.ok(secondWarning);
    assert.equal(
      createStageReviewDeduplicationKey(firstWarning),
      createStageReviewDeduplicationKey(secondWarning),
    );
  });

  await test("returning source-managed row suppresses previous missing warning", async () => {
    const [proposal] = normalizedFixture();
    const rows = await matchStageResultProposals(
      [proposal!],
      fakePrisma({ existingPosition: 1, existingStageResultId: "stage-result-missing" }),
    );
    const withWarnings = await appendMissingSourceStageResultWarnings({
      rows,
      config: getErzbergrodeoStageResultsConfig(),
      client: fakePrisma({
        sourceManagedMissing: true,
        existingStageResultId: "stage-result-missing",
      }),
    });
    assert.equal(
      withWarnings.some((row) => row.reviewAction === "STAGE_RESULT_MISSING_SOURCE"),
      false,
    );
  });

  await test("rows outside connector event stage class scope are not flagged", async () => {
    const rows = await matchStageResultProposals(normalizedFixture(), fakePrisma());
    const withWarnings = await appendMissingSourceStageResultWarnings({
      rows,
      config: getErzbergrodeoStageResultsConfig(),
      client: fakePrisma({ sourceManagedOutsideScope: true }),
    });
    assert.equal(
      withWarnings.some((row) => row.reviewAction === "STAGE_RESULT_MISSING_SOURCE"),
      false,
    );
  });

  await test("manual unrelated StageResult rows are not flagged without source lineage", async () => {
    const rows = await matchStageResultProposals(normalizedFixture(), fakePrisma());
    const withWarnings = await appendMissingSourceStageResultWarnings({
      rows,
      config: getErzbergrodeoStageResultsConfig(),
      client: fakePrisma({ manualStageResultOnly: true }),
    });
    assert.equal(
      withWarnings.some((row) => row.reviewAction === "STAGE_RESULT_MISSING_SOURCE"),
      false,
    );
  });

  await test("stale StageResult state is rejected before apply", () => {
    assert.throws(
      () =>
        assertNoStaleChangedFields({
          entityLabel: "StageResult",
          changedFields: ["overallPosition"],
          aggregateField: "stageResult",
          previousState: { overallPosition: 4 },
          expectedState: { overallPosition: 3 },
        }),
      /Stale StageResult state for overallPosition/,
    );
    assert.doesNotThrow(() =>
      assertNoStaleChangedFields({
        entityLabel: "StageResult",
        changedFields: ["overallPosition"],
        aggregateField: "stageResult",
        previousState: { overallPosition: 3 },
        expectedState: { overallPosition: 3 },
      }),
    );
  });

  console.log("Stage results import pipeline tests passed.");
}

function normalizedFixture() {
  return normalizeStageResultRows({
    rows: parseStageResultsCsv(readFixture()).slice(0, 1),
    config: getErzbergrodeoStageResultsConfig(),
  });
}

function readFixture() {
  return readFileSync(
    path.join(
      projectRoot,
      "jobs/connectors/results/fixtures/erzbergrodeo-2026-main-race-stage-results.csv",
    ),
    "utf8",
  );
}

function fakePrisma({
  riderMissing = false,
  existingPosition = null,
  ambiguousStageName = false,
  sourceManagedMissing = false,
  sourceManagedOutsideScope = false,
  manualStageResultOnly = false,
  existingStageResultId = "stage-result-existing",
}: {
  riderMissing?: boolean;
  existingPosition?: number | null;
  ambiguousStageName?: boolean;
  sourceManagedMissing?: boolean;
  sourceManagedOutsideScope?: boolean;
  manualStageResultOnly?: boolean;
  existingStageResultId?: string;
} = {}) {
  const stage = {
    id: "stage-final",
    eventId: "event-erzberg",
    name: "Final",
    slug: "final",
    stageOrder: 4,
    stageType: "FINAL",
  };
  const missingStageResult = {
    id: "stage-result-missing",
    stageId: "stage-final",
    riderId:
      existingStageResultId === "stage-result-missing" ? "rider-mani" : "rider-other",
    motorcycleId: null,
    manufacturerId: "manufacturer-ktm",
    className: "Pro",
    overallPosition: 9,
    status: "FINISHED",
    totalTimeMs: null,
    totalTimeText: null,
    gapToLeaderText: null,
    gapToPreviousText: null,
    stage: {
      ...stage,
      event: {
        id: "event-erzberg",
        slug: "erzbergrodeo-2026",
        name: "Red Bull Erzbergrodeo",
      },
    },
    rider: {
      id: existingStageResultId === "stage-result-missing" ? "rider-mani" : "rider-other",
      firstName: existingStageResultId === "stage-result-missing" ? "Manuel" : "Source",
      lastName:
        existingStageResultId === "stage-result-missing" ? "Lettenbichler" : "Managed",
      slug:
        existingStageResultId === "stage-result-missing"
          ? "manuel-lettenbichler"
          : "source-managed",
    },
    manufacturer: { id: "manufacturer-ktm", name: "KTM" },
    motorcycle: null,
  };
  const outsideScopeStageResult = {
    ...missingStageResult,
    id: "stage-result-outside-scope",
    stageId: "stage-other",
    stage: {
      ...stage,
      id: "stage-other",
      slug: "day-1",
      stageOrder: 2,
      event: {
        id: "event-erzberg",
        slug: "erzbergrodeo-2026",
        name: "Red Bull Erzbergrodeo",
      },
    },
  };
  return {
    dataSource: {
      findFirst: async () =>
        manualStageResultOnly ? null : { id: "data-source-stage-results" },
    },
    sourceLink: {
      findMany: async () => {
        if (manualStageResultOnly) return [];
        if (sourceManagedOutsideScope) {
          return [{ entityId: "stage-result-outside-scope" }];
        }
        if (sourceManagedMissing) return [{ entityId: "stage-result-missing" }];
        return [];
      },
    },
    event: {
      findUnique: async ({ where }: { where: { slug?: string; id?: string } }) =>
        where.slug === "erzbergrodeo-2026" || where.id === "event-erzberg"
          ? { id: "event-erzberg" }
          : null,
      findFirst: async () => null,
    },
    raceStage: {
      findUnique: async ({
        where,
      }: {
        where: {
          id?: string;
          eventId_slug?: { eventId: string; slug: string };
          eventId_stageOrder?: { eventId: string; stageOrder: number };
        };
      }) =>
        where.id === "stage-final" ||
        where.eventId_slug?.slug === "final" ||
        where.eventId_stageOrder?.stageOrder === 4
          ? stage
          : null,
      findMany: async () =>
        ambiguousStageName ? [stage, { ...stage, id: "stage-copy" }] : [stage],
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
    stageResult: {
      findFirst: async () =>
        existingPosition === null
          ? null
          : {
              id: existingStageResultId,
              stageId: "stage-final",
              riderId: "rider-mani",
              motorcycleId: null,
              manufacturerId: "manufacturer-ktm",
              className: "Pro",
              overallPosition: existingPosition,
              status: "FINISHED",
              totalTimeMs: null,
              totalTimeText: null,
              gapToLeaderText: null,
              gapToPreviousText: null,
            },
      findMany: async ({
        where,
      }: {
        where: {
          id?: { in: string[] };
          stageId?: { in: string[] };
          OR?: Array<{ className: string | null }>;
        };
      }) => {
        const candidates = [
          ...(sourceManagedMissing ? [missingStageResult] : []),
          ...(sourceManagedOutsideScope ? [outsideScopeStageResult] : []),
        ];
        return candidates.filter((row) => {
          const idMatches = where.id?.in.includes(row.id) ?? true;
          const stageMatches = where.stageId?.in.includes(row.stageId) ?? true;
          const classMatches =
            where.OR?.some((scope) => scope.className === row.className) ?? true;
          return idMatches && stageMatches && classMatches;
        });
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
