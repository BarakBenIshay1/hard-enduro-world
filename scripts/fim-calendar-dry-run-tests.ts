import assert from "node:assert/strict";
import { compareFimCalendarCandidates } from "@/jobs/connectors/fim-calendar/compare";
import { normalizeFimCalendarItems } from "@/jobs/connectors/fim-calendar/normalize";
import { getFimCalendarConfig } from "@/jobs/connectors/fim-calendar/config";
import type {
  FimCalendarCurrentEvent,
  RawFimCalendarItem,
} from "@/jobs/connectors/fim-calendar";

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

test("Erzbergrodeo alias matching", () => {
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

test("Romaniacs exact slug matching", () => {
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

test("sponsor-name normalization and season-year removal", () => {
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

test("partial-season input suppresses unrelated missing-source warnings", () => {
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

test("date-only comparison ignores time-of-day defaults", () => {
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

test("equivalent status mapping", () => {
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

test("ambiguous event protection", () => {
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

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}
