import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ResultStatus } from "@prisma/client";
import {
  stageResultsConnectorKey,
  stageResultsConnectorVersion,
  type NormalizedStageResultProposal,
  type ParsedStageResultRow,
  type StageResultsSourceConfig,
} from "./stage-types";

const fixturePath = path.join(
  process.cwd(),
  "jobs/connectors/results/fixtures/erzbergrodeo-2026-main-race-stage-results.csv",
);

const allowedStatuses: ResultStatus[] = ["FINISHED", "DNF", "DNS", "DSQ", "UNKNOWN"];

export function getErzbergrodeoStageResultsConfig(): StageResultsSourceConfig {
  return {
    sourceId: "red-bull-erzbergrodeo-official-stage-results",
    sourceName: "Red Bull Erzbergrodeo Official Stage Results",
    sourceUrl:
      process.env.OFFICIAL_STAGE_RESULTS_URL ||
      process.env.OFFICIAL_RESULTS_URL ||
      "https://www.redbullerzbergrodeo.com",
    eventSlug: "erzbergrodeo-2026",
    seasonYear: 2026,
    inputType:
      process.env.OFFICIAL_STAGE_RESULTS_URL || process.env.OFFICIAL_RESULTS_URL
        ? "official-fetch"
        : "local-official-fixture",
  };
}

export async function fetchErzbergrodeoStageResultsPayload(
  config = getErzbergrodeoStageResultsConfig(),
) {
  if (!process.env.OFFICIAL_STAGE_RESULTS_URL && !process.env.OFFICIAL_RESULTS_URL) {
    return {
      rawContent: await readFile(fixturePath, "utf8"),
      contentType: "text/csv",
      statusCode: 200,
      finalUrl: fixturePath,
      inputType: "local-official-fixture" as const,
      fetchedAt: new Date(),
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(config.sourceUrl, {
      signal: controller.signal,
      headers: {
        "user-agent": `HardEnduroWorld/${stageResultsConnectorVersion} (${stageResultsConnectorKey})`,
        accept: "text/csv, application/json, text/html;q=0.8, */*;q=0.5",
      },
    });
    return {
      rawContent: await response.text(),
      contentType: response.headers.get("content-type") ?? "unknown",
      statusCode: response.status,
      finalUrl: response.url,
      inputType: "official-fetch" as const,
      fetchedAt: new Date(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function parseStageResultsCsv(rawContent: string): ParsedStageResultRow[] {
  const rows = rawContent
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);
  const [headerRow, ...dataRows] = rows;
  if (!headerRow) return [];

  const headers = splitCsvRow(headerRow).map(normalizeKey);
  return dataRows.map((row) => {
    const values = splitCsvRow(row);
    const record = Object.fromEntries(
      headers.map((header, index) => [header, emptyToNull(values[index])]),
    );

    return {
      sourceRowId: stringValue(record.sourcerowid),
      sourceStageId: stringValue(record.sourcestageid),
      sourceStageName: stringValue(record.sourcestagename),
      eventSlug: stringValue(record.eventslug),
      eventName: stringValue(record.eventname),
      seasonYear: numberValue(record.seasonyear),
      stageSlug: stringValue(record.stageslug),
      stageOrder: numberValue(record.stageorder),
      riderSlug: stringValue(record.riderslug),
      riderName: stringValue(record.ridername),
      countryCode: stringValue(record.countrycode),
      position: numberValue(record.position),
      status: statusValue(record.status),
      manufacturer: stringValue(record.manufacturer),
      motorcycle: stringValue(record.motorcycle),
      team: stringValue(record.team),
      totalTimeText: stringValue(record.totaltimetext),
      gapToLeaderText: stringValue(record.gaptoleadertext),
      gapToPreviousText: stringValue(record.gaptoprevioustext),
      className: stringValue(record.classname),
      officialSourceUrl: stringValue(record.officialsourceurl),
      raw: record,
    };
  });
}

export function normalizeStageResultRows({
  rows,
  config,
}: {
  rows: ParsedStageResultRow[];
  config: StageResultsSourceConfig;
}): NormalizedStageResultProposal[] {
  return rows.map((row, index) => ({
    sourceRowId:
      row.sourceRowId ??
      [
        config.eventSlug,
        row.sourceStageId ?? row.stageSlug ?? row.stageOrder ?? "stage",
        row.position ?? "no-position",
        row.riderSlug ?? row.riderName ?? index + 1,
      ]
        .join("-")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-"),
    sourceStageId: row.sourceStageId,
    sourceStageName: row.sourceStageName,
    sourceId: config.sourceId,
    eventSlug: row.eventSlug ?? config.eventSlug,
    eventName: row.eventName,
    seasonYear: row.seasonYear ?? config.seasonYear,
    stageSlug: row.stageSlug,
    stageOrder: row.stageOrder,
    riderSlug: row.riderSlug,
    riderName: row.riderName,
    countryCode: row.countryCode,
    position: row.position,
    status: row.status && row.status !== "INVALID" ? row.status : null,
    manufacturer: row.manufacturer,
    motorcycle: row.motorcycle,
    team: row.team,
    totalTimeMs: parseDurationMs(row.totalTimeText),
    totalTimeText: row.totalTimeText,
    gapToLeaderText: row.gapToLeaderText,
    gapToPreviousText: row.gapToPreviousText,
    className: row.className,
    officialSourceUrl: row.officialSourceUrl ?? config.sourceUrl,
    officialRawRow: row.raw,
  }));
}

export function parseDurationMs(value: string | null) {
  if (!value) return null;
  if (!/^\d{1,2}:\d{2}:\d{2}(?:\.\d{1,3})?$/.test(value)) return Number.NaN;
  const [hoursRaw, minutesRaw, secondsRaw] = value.split(":");
  const seconds = Number(secondsRaw);
  return (
    Number(hoursRaw) * 60 * 60 * 1000 + Number(minutesRaw) * 60 * 1000 + seconds * 1000
  );
}

function splitCsvRow(row: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (const character of row) {
    if (character === '"') {
      quoted = !quoted;
      continue;
    }
    if (character === "," && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  values.push(current.trim());
  return values;
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function emptyToNull(value: string | undefined) {
  return value && value.trim() ? value.trim() : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function statusValue(value: unknown): ResultStatus | "INVALID" | null {
  const status = stringValue(value)?.toUpperCase();
  if (!status) return null;
  if (status === "FINISHED" || status === "FINISH") return "FINISHED";
  if (allowedStatuses.includes(status as ResultStatus)) return status as ResultStatus;
  return "INVALID";
}
