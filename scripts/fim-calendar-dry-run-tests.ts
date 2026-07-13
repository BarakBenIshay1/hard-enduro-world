import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compareFimCalendarCandidates } from "@/jobs/connectors/fim-calendar/compare";
import { normalizeFimCalendarItems } from "@/jobs/connectors/fim-calendar/normalize";
import { getFimCalendarConfig } from "@/jobs/connectors/fim-calendar/config";
import { fetchFimCalendarOfficialSource } from "@/jobs/connectors/fim-calendar/fetcher";
import { parseFimCalendarPayload } from "@/jobs/connectors/fim-calendar/parser";
import { runFimCalendarDryRun } from "@/jobs/connectors/fim-calendar";
import {
  createMemoryFimCalendarPersistenceRepository,
  createNoPersistenceResult,
  createStableChecksum,
  persistFimCalendarReviewRun,
  stableStringify,
} from "@/jobs/connectors/fim-calendar/persistence";
import type {
  FimCalendarDryRunReport,
  FimCalendarCurrentEvent,
  RawFimCalendarItem,
} from "@/jobs/connectors/fim-calendar";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const configResult = getFimCalendarConfig();
if (!configResult.config) {
  throw new Error("FIM calendar config should be available for tests.");
}
const config = configResult.config;

const baseEvent: FimCalendarCurrentEvent = {
  id: "event-erzberg",
  slug: "erzbergrodeo-2026",
  name: "Erzbergrodeo 2026",
  seasonYear: 2026,
  country: "Austria",
  countryCode: "AT",
  location: "Eisenerz",
  venue: "Erzberg",
  startDate: "2026-06-04T09:30:00.000Z",
  endDate: "2026-06-07T17:00:00.000Z",
  status: "COMPLETED",
  officialUrl: "https://www.redbullerzbergrodeo.com",
};

async function main() {
  await test("Erzbergrodeo alias matching", () => {
    const rows = compare(
      [baseEvent],
      [
        {
          eventName: "Red Bull Erzbergrodeo 2026",
          seasonYear: 2026,
          country: "Austria",
          countryCode: "AT",
          location: "Eisenerz",
          startDate: "2026-06-04",
          endDate: "2026-06-07",
          status: "Race Completed",
          officialUrl: "https://www.redbullerzbergrodeo.com",
        },
      ],
    );

    assert.equal(rows[0]?.changeType, "existing-event-unchanged");
    assert.equal(rows[0]?.matchingStrategy, "explicit-alias");
  });

  await test("Romaniacs exact slug matching", () => {
    const rows = compare(
      [
        {
          ...baseEvent,
          id: "event-romaniacs",
          slug: "red-bull-romaniacs-2026",
          name: "Red Bull Romaniacs",
          country: "Romania",
          countryCode: "RO",
          location: "Sibiu",
          startDate: "2026-07-21T00:00:00.000Z",
          endDate: "2026-07-25T00:00:00.000Z",
          status: "SCHEDULED",
          officialUrl: "https://www.redbullromaniacs.com",
        },
      ],
      [
        {
          eventName: "Red Bull Romaniacs",
          seasonYear: 2026,
          country: "Romania",
          countryCode: "RO",
          location: "Sibiu",
          startDate: "2026-07-21",
          endDate: "2026-07-25",
          status: "scheduled",
          officialUrl: "https://www.redbullromaniacs.com",
        },
      ],
    );

    assert.equal(rows[0]?.changeType, "existing-event-unchanged");
    assert.equal(rows[0]?.matchingStrategy, "exact-normalized-slug");
  });

  await test("sponsor-name normalization and season-year removal", () => {
    const rows = compare(
      [
        {
          ...baseEvent,
          slug: "hixpania-hard-enduro-2026",
          name: "Hixpania Hard Enduro 2026",
        },
      ],
      [
        {
          eventName: "Red Bull Hixpania Hard Enduro",
          seasonYear: 2026,
          country: "Spain",
          countryCode: "ES",
          location: "Aguilar de Campoo",
          startDate: "2026-10-01",
          status: "scheduled",
        },
      ],
    );

    assert.equal(rows[0]?.matchingStrategy, "sponsorless-name-season");
  });

  await test("partial-season input suppresses unrelated missing-source warnings", () => {
    const rows = compare(
      [
        baseEvent,
        {
          ...baseEvent,
          id: "event-other",
          slug: "other-event-2026",
          name: "Other Event",
        },
      ],
      [
        {
          eventName: "Red Bull Erzbergrodeo",
          seasonYear: 2026,
          startDate: "2026-06-04",
          status: "completed",
        },
      ],
      "partial-season",
    );

    assert.equal(
      rows.some((row) => row.changeType === "missing-from-source"),
      false,
    );
    assert.equal(
      rows.some((row) => row.changeType === "not-evaluated-partial-input"),
      true,
    );
  });

  await test("date-only comparison ignores time-of-day defaults", () => {
    const rows = compare(
      [baseEvent],
      [
        {
          eventName: "Erzbergrodeo 2026",
          seasonYear: 2026,
          startDate: "2026-06-04",
          endDate: "2026-06-07",
          status: "completed",
        },
      ],
    );

    assert.equal(
      rows.some((row) => row.changeType === "date-changed"),
      false,
    );
    assert.equal(
      rows.some((row) => row.changeType === "time-changed"),
      false,
    );
  });

  await test("equivalent status mapping", () => {
    const rows = compare(
      [{ ...baseEvent, status: "SCHEDULED" }],
      [
        {
          eventName: "Erzbergrodeo 2026",
          seasonYear: 2026,
          startDate: "2026-06-04",
          status: "Coming Soon",
        },
      ],
    );

    assert.equal(
      rows.some((row) => row.changeType === "status-changed"),
      false,
    );
  });

  await test("ambiguous event protection", () => {
    const rows = compare(
      [
        baseEvent,
        { ...baseEvent, id: "event-erzberg-copy", slug: "copy-erzbergrodeo-2026" },
      ],
      [
        {
          eventName: "Erzbergrodeo",
          seasonYear: 2026,
          startDate: "2026-06-04",
        },
      ],
    );

    assert.equal(rows[0]?.changeType, "ambiguous-match-requires-review");
  });

  await test("official HTML fixture parses event metadata without network", () => {
    const fixture = readFileSync(
      path.join(
        projectRoot,
        "jobs/connectors/fim-calendar/fixtures/official-calendar-snapshot.html",
      ),
      "utf8",
    );
    const payload = parseFimCalendarPayload(fixture);

    assert.equal(payload.inputSourceType, "local-html");
    assert.equal(payload.items.length, 1);
    assert.equal(payload.items[0]?.sourceEventId, "fim-fixture-red-bull-romaniacs-2026");
    assert.equal(payload.items[0]?.eventName, "Red Bull Romaniacs");
    assert.equal(payload.items[0]?.country, "Romania");
    assert.equal(payload.items[0]?.location, "Sibiu");
    assert.equal(payload.items[0]?.venue, "Sibiu");
    assert.equal(payload.items[0]?.officialUrl, "https://www.redbullromaniacs.com");
  });

  await test("real FIM calendar fragment parses and rejects non-championship rows", () => {
    const fixture = readFileSync(
      path.join(
        projectRoot,
        "jobs/connectors/fim-calendar/fixtures/fim-calendar-2026-fragment.html",
      ),
      "utf8",
    );
    const payload = parseFimCalendarPayload(fixture);

    assert.equal(payload.diagnostics.parserSelected, "fim-solr-calendar-html");
    assert.equal(payload.diagnostics.rawRecordsDetected, 3);
    assert.equal(payload.diagnostics.usableEventsParsed, 2);
    assert.equal(payload.diagnostics.recordsRejected, 1);
    assert.equal(payload.items[0]?.sourceEventId, "94054");
    assert.equal(payload.items[0]?.eventName, "Alestrem");
    assert.equal(payload.items[0]?.country, "France");
    assert.equal(payload.items[0]?.countryCode, "FRA");
    assert.equal(payload.items[0]?.location, "Alès");
    assert.equal(payload.items[0]?.status, "Race Completed");
    assert.equal(payload.items[1]?.eventName, "Hixpania");
    assert.equal(payload.items[1]?.status, "Coming Soon");
  });

  await test("season filtering keeps only requested official candidates", () => {
    const fixture = readFileSync(
      path.join(
        projectRoot,
        "jobs/connectors/fim-calendar/fixtures/fim-calendar-2026-fragment.html",
      ),
      "utf8",
    );
    const payload = parseFimCalendarPayload(fixture);
    const candidates = normalizeFimCalendarItems(payload.items, config);

    assert.equal(
      candidates.filter((candidate) => candidate.seasonYear === 2026).length,
      2,
    );
    assert.equal(
      candidates.filter((candidate) => candidate.seasonYear === 2025).length,
      0,
    );
  });

  await test("official fetch with empty usable data fails closed", async () => {
    const report = await runFimCalendarDryRun({
      rawContent: "<html><body>No calendar table</body></html>",
      currentEvents: [],
      seasonYear: 2026,
      coverageMode: "full-season",
      inputSourceType: "official-fetch",
      inputDiagnostics: {
        requestedOfficialUrl:
          "https://www.fim-moto.com/en/sports/view/fim-hard-enduro-world-championship-5410",
        finalResponseUrl:
          "https://www.fim-moto.com/en/sports/view/fim-hard-enduro-world-championship-5410",
        httpStatus: 200,
        contentType: "text/html",
        responseSizeBytes: 43,
        fallbackUsed: false,
        fetchStatus: "official-fetch-success",
      },
    });

    assert.equal(report.metadata.inputSourceType, "official-fetch");
    assert.equal(report.metadata.diagnostics.fetchStatus, "official-fetch-incomplete");
    assert.equal(report.metadata.diagnostics.usableEventsParsed, 0);
    assert.equal(report.summary.errors.length > 0, true);
  });

  await test("local fallback is labeled separately from official fetch", async () => {
    const report = await runFimCalendarDryRun({
      rawItems: [
        {
          eventName: "Red Bull Erzbergrodeo",
          seasonYear: 2026,
          startDate: "2026-06-04",
        },
      ],
      currentEvents: [],
      seasonYear: 2026,
      coverageMode: "partial-season",
      inputDiagnostics: {
        fallbackUsed: true,
        fetchStatus: "fallback-local-json",
      },
    });

    assert.equal(report.metadata.diagnostics.fallbackUsed, true);
    assert.equal(report.metadata.diagnostics.fetchStatus, "fallback-local-json");
  });

  await test("official fetch discovers FIM calendar endpoint and follows redirects", async () => {
    const fixture = readFileSync(
      path.join(
        projectRoot,
        "jobs/connectors/fim-calendar/fixtures/fim-calendar-2026-fragment.html",
      ),
      "utf8",
    );
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      calls.push(String(url));
      if (calls.length === 1) {
        return createResponse(
          `<a id="championship-calendar" data-url="https://www.fim-moto.com/en/calendars?tx_solr%5Bfilter%5D%5Btimeless%5D=timeless%3A521&amp;tx_solr%5Bfilter%5D%5Byear%5D=year%3A2023&amp;tx_solr%5Bview%5D=event&amp;type=1767885145">Calendar</a>`,
          "https://www.fim-moto.com/en/sports/view/fim-hard-enduro-world-championship-5410",
        );
      }

      return createResponse(fixture, String(url));
    };

    const result = await fetchFimCalendarOfficialSource({
      url: "https://www.fim-moto.com/en/sports/view/fim-hard-enduro-world-championship-5410",
      seasonYear: 2026,
      fetchImpl,
      retries: 0,
    });

    assert.equal(result.ok, true);
    assert.equal(calls.length, 2);
    assert.equal(calls[1]?.includes("year%3A2026"), true);
    assert.equal(result.ok ? result.endpointDiscovered : false, true);
  });

  await test("stable payload hashing ignores object insertion order", () => {
    assert.equal(stableStringify({ b: 2, a: 1 }), stableStringify({ a: 1, b: 2 }));
    assert.equal(
      createStableChecksum({ b: 2, a: 1 }),
      createStableChecksum({ a: 1, b: 2 }),
    );
  });

  await test("snapshot creation and review item creation are internal only", async () => {
    const repository = createMemoryFimCalendarPersistenceRepository();
    const result = await persistFimCalendarReviewRun({
      repository,
      input: createPersistenceInput(
        createReportWithRows([newEventRow("Alestrem", "94054")]),
      ),
    });

    assert.equal(result.performed, true);
    assert.equal(result.snapshotCreated, true);
    assert.equal(repository.snapshots.length, 1);
    assert.equal(result.reviewItemsCreated.length, 1);
    assert.equal(result.reviewItemsCreated[0]?.reviewStatus, "PENDING");
    assert.equal(result.publicEventsUpdated, 0);
  });

  await test("duplicate snapshot reuses existing snapshot and avoids duplicate reviews", async () => {
    const repository = createMemoryFimCalendarPersistenceRepository();
    const input = createPersistenceInput(
      createReportWithRows([newEventRow("Alestrem", "94054")]),
    );

    const first = await persistFimCalendarReviewRun({ repository, input });
    const second = await persistFimCalendarReviewRun({ repository, input });

    assert.equal(first.snapshotCreated, true);
    assert.equal(second.snapshotReused, true);
    assert.equal(second.duplicateSnapshotDetected, true);
    assert.equal(repository.snapshots.length, 1);
    assert.equal(repository.reviewItems.length, 1);
  });

  await test("different payload creates a new snapshot", async () => {
    const repository = createMemoryFimCalendarPersistenceRepository();

    await persistFimCalendarReviewRun({
      repository,
      input: createPersistenceInput(
        createReportWithRows([newEventRow("Alestrem", "94054")]),
      ),
    });
    const second = await persistFimCalendarReviewRun({
      repository,
      input: createPersistenceInput(
        createReportWithRows([newEventRow("Hixpania", "94049")]),
        [normalizedCandidate("Hixpania", "94049")],
      ),
    });

    assert.equal(second.snapshotCreated, true);
    assert.equal(repository.snapshots.length, 2);
  });

  await test("same pending proposed change is reused across new snapshot", async () => {
    const repository = createMemoryFimCalendarPersistenceRepository();

    await persistFimCalendarReviewRun({
      repository,
      input: createPersistenceInput(
        createReportWithRows([newEventRow("Alestrem", "94054")]),
      ),
    });
    const second = await persistFimCalendarReviewRun({
      repository,
      input: createPersistenceInput(
        createReportWithRows([newEventRow("Alestrem", "94054")]),
        [{ ...normalizedCandidate("Alestrem", "94054"), location: "Ales" }],
      ),
    });

    assert.equal(second.reviewItemsReused.length, 1);
    assert.equal(repository.reviewItems.length, 1);
  });

  await test("materially different pending proposal supersedes previous pending item", async () => {
    const repository = createMemoryFimCalendarPersistenceRepository();

    await persistFimCalendarReviewRun({
      repository,
      input: createPersistenceInput(
        createReportWithRows([newEventRow("Alestrem", "94054")]),
      ),
    });
    const changed = newEventRow("Alestrem", "94054");
    changed.proposedValue = { ...changed.proposedValue, location: "New Venue" };
    const second = await persistFimCalendarReviewRun({
      repository,
      input: createPersistenceInput(createReportWithRows([changed]), [
        { ...normalizedCandidate("Alestrem", "94054"), location: "New Venue" },
      ]),
    });

    assert.equal(second.reviewItemsSuperseded.length, 1);
    assert.equal(second.reviewItemsCreated.length, 1);
    assert.equal(repository.reviewItems[0]?.reviewStatus, "SUPERSEDED");
    assert.equal(repository.reviewItems[1]?.reviewStatus, "PENDING");
  });

  await test("approved and rejected review items are not reopened automatically", async () => {
    const repository = createMemoryFimCalendarPersistenceRepository();
    await persistFimCalendarReviewRun({
      repository,
      input: createPersistenceInput(
        createReportWithRows([newEventRow("Alestrem", "94054")]),
      ),
    });
    repository.reviewItems[0]!.reviewStatus = "APPROVED";

    const second = await persistFimCalendarReviewRun({
      repository,
      input: createPersistenceInput(
        createReportWithRows([newEventRow("Alestrem", "94054")]),
        [{ ...normalizedCandidate("Alestrem", "94054"), location: "Ales" }],
      ),
    });
    repository.reviewItems[1]!.reviewStatus = "REJECTED";
    const third = await persistFimCalendarReviewRun({
      repository,
      input: createPersistenceInput(
        createReportWithRows([newEventRow("Alestrem", "94054")]),
        [{ ...normalizedCandidate("Alestrem", "94054"), location: "Ales-2" }],
      ),
    });

    assert.equal(second.reviewItemsCreated.length, 1);
    assert.equal(third.reviewItemsCreated.length, 1);
    assert.equal(repository.reviewItems[0]?.reviewStatus, "APPROVED");
    assert.equal(repository.reviewItems[1]?.reviewStatus, "REJECTED");
  });

  await test("unchanged and ignored rows do not create review items", async () => {
    const repository = createMemoryFimCalendarPersistenceRepository();
    const result = await persistFimCalendarReviewRun({
      repository,
      input: createPersistenceInput(
        createReportWithRows([
          {
            ...newEventRow("Alestrem", "94054"),
            changeType: "existing-event-unchanged",
            severity: "info",
          },
          {
            ...newEventRow("Partial input", "partial"),
            changeType: "not-evaluated-partial-input",
            severity: "info",
          },
        ]),
      ),
    });

    assert.equal(result.reviewItemsCreated.length, 0);
  });

  await test("transaction rollback stores nothing", async () => {
    const repository = createMemoryFimCalendarPersistenceRepository({
      failOnCommit: true,
    });
    await assert.rejects(() =>
      persistFimCalendarReviewRun({
        repository,
        input: createPersistenceInput(
          createReportWithRows([newEventRow("Alestrem", "94054")]),
        ),
      }),
    );

    assert.equal(repository.snapshots.length, 0);
    assert.equal(repository.reviewItems.length, 0);
  });

  await test("default no-persistence behavior is explicit in report metadata", () => {
    const result = createNoPersistenceResult(false);

    assert.equal(result.requested, false);
    assert.equal(result.performed, false);
    assert.equal(result.publicEventsUpdated, 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function compare(
  currentEvents: FimCalendarCurrentEvent[],
  rawItems: RawFimCalendarItem[],
  coverageMode: "full-season" | "partial-season" | "single-event" = "full-season",
) {
  const candidates = normalizeFimCalendarItems(rawItems, config);
  return compareFimCalendarCandidates({
    candidates,
    currentEvents,
    coverageMode,
  });
}

async function test(name: string, run: () => void | Promise<void>) {
  await run();
  console.log(`ok - ${name}`);
}

function createResponse(body: string, url: string) {
  const response = new Response(body, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
  Object.defineProperty(response, "url", { value: url });
  return response;
}

function createPersistenceInput(
  report: FimCalendarDryRunReport,
  normalizedCandidates = [normalizedCandidate("Alestrem", "94054")],
) {
  return {
    report,
    normalizedCandidates,
    startedAt: new Date("2026-07-13T10:00:00.000Z"),
    finishedAt: new Date("2026-07-13T10:00:02.000Z"),
    environment: "test",
    gitCommitSha: "test-sha",
    connectorVersion: "test-version",
  };
}

function createReportWithRows(
  rows: FimCalendarDryRunReport["rows"],
): FimCalendarDryRunReport {
  return {
    summary: {
      sourceId: "fim-hard-enduro-world-championship",
      runMode: "dry-run",
      seasonYear: 2026,
      totalSourceEvents: rows.length,
      totalMatchedEvents: 0,
      newCandidates: rows.filter((row) => row.changeType === "new-event-found").length,
      changedCandidates: rows.filter((row) => row.changeType.endsWith("-changed")).length,
      ambiguousCandidates: rows.filter(
        (row) => row.changeType === "ambiguous-match-requires-review",
      ).length,
      warnings: [],
      errors: [],
    },
    metadata: {
      inputCoverageMode: "full-season",
      inputSourceType: "official-fetch",
      inputCompletenessWarning: null,
      diagnostics: {
        requestedOfficialUrl:
          "https://www.fim-moto.com/en/sports/view/fim-hard-enduro-world-championship-5410",
        finalResponseUrl:
          "https://www.fim-moto.com/en/calendars?tx_solr%5Bfilter%5D%5Byear%5D=year%3A2026",
        httpStatus: 200,
        contentType: "text/plain;charset=UTF-8",
        responseSizeBytes: 1000,
        parserSelected: "fim-solr-calendar-html",
        rawRecordsDetected: rows.length,
        usableEventsParsed: rows.length,
        recordsRejected: 0,
        rejectionReasons: [],
        fallbackUsed: false,
        fetchStatus: "official-fetch-success",
      },
    },
    rows,
    reviewItems: [],
    source: {
      id: "fim-hard-enduro-world-championship",
      displayName: "FIM Hard Enduro World Championship",
      priority: "critical",
      confidenceLevel: "official-primary",
      reviewPolicy: "always-review",
      sourceUrl:
        "https://www.fim-moto.com/en/sports/view/fim-hard-enduro-world-championship-5410",
    },
  };
}

function newEventRow(
  eventName: string,
  sourceEventId: string,
): FimCalendarDryRunReport["rows"][number] {
  return {
    eventName,
    currentValue: null,
    proposedValue: {
      sourceEventId,
      eventName,
      seasonYear: 2026,
      location: "Test Venue",
    },
    changeType: "new-event-found",
    confidence: {
      level: "official-primary",
      score: 0.9,
      reason: "Test confidence.",
    },
    severity: "review-required",
    reviewRecommendation: "Review as a new event candidate.",
    sourceUrl: "https://www.fim-moto.com/en/calendars/view/test",
    matchingStrategy: "unmatched",
    matchingConfidence: 0,
    ambiguousReason: null,
  };
}

function normalizedCandidate(eventName: string, sourceEventId: string) {
  return {
    sourceEventId,
    seasonYear: 2026,
    eventName,
    slugCandidate: `${eventName.toLowerCase()}-2026`,
    country: "Test",
    countryCode: "TST",
    location: "Test Venue",
    venue: "Test Venue",
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-01-02T00:00:00.000Z",
    raceStatusCandidate: "Coming Soon" as const,
    startDatePrecision: "date" as const,
    endDatePrecision: "date" as const,
    officialUrl: "https://www.fim-moto.com/en/calendars/view/test",
    sourceId: "fim-hard-enduro-world-championship",
    confidence: {
      level: "official-primary" as const,
      score: 0.9,
      reason: "Test confidence.",
    },
    reviewRequired: true as const,
    notes: "Test candidate.",
  };
}
