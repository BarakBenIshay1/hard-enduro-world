import type {
  OfficialResultStatus,
  RawOfficialResult,
  ResultsPayloadType,
} from "@/jobs/connectors/results/types";

export function parseOfficialResultsPlaceholder(
  results: RawOfficialResult[],
): RawOfficialResult[] {
  return results.filter(
    (result) =>
      result.externalId &&
      result.event &&
      result.stage &&
      result.rider &&
      result.country &&
      result.officialSourceUrl,
  );
}

export function parseOfficialResultsPayload({
  rawContent,
  payloadType,
  sourceUrl,
}: {
  rawContent: string;
  payloadType: ResultsPayloadType;
  sourceUrl: string;
}): RawOfficialResult[] {
  if (!rawContent.trim() || payloadType === "pdf-metadata") {
    return [];
  }

  if (payloadType === "json") {
    return parseOfficialResultsPlaceholder(parseJsonResults(rawContent, sourceUrl));
  }

  if (payloadType === "csv") {
    return parseOfficialResultsPlaceholder(parseCsvResults(rawContent, sourceUrl));
  }

  if (payloadType === "html") {
    return parseOfficialResultsPlaceholder(parseHtmlResults(rawContent, sourceUrl));
  }

  return parseOfficialResultsPlaceholder([
    ...parseJsonResults(rawContent, sourceUrl),
    ...parseCsvResults(rawContent, sourceUrl),
    ...parseHtmlResults(rawContent, sourceUrl),
  ]);
}

type FlexibleResultRecord = Record<string, unknown>;

function parseJsonResults(rawContent: string, sourceUrl: string): RawOfficialResult[] {
  try {
    const parsed = JSON.parse(rawContent) as unknown;
    const rows = Array.isArray(parsed)
      ? parsed
      : typeof parsed === "object" &&
          parsed !== null &&
          Array.isArray((parsed as { results?: unknown }).results)
        ? (parsed as { results: unknown[] }).results
        : [];

    return rows
      .filter(
        (row): row is FlexibleResultRecord => typeof row === "object" && row !== null,
      )
      .map((row, index) => flexibleRecordToResult(row, index, sourceUrl));
  } catch {
    return [];
  }
}

function parseCsvResults(rawContent: string, sourceUrl: string): RawOfficialResult[] {
  const rows = rawContent
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);
  const [headerRow, ...dataRows] = rows;

  if (!headerRow || dataRows.length === 0) {
    return [];
  }

  const headers = splitCsvRow(headerRow).map(normalizeKey);

  return dataRows.map((row, index) => {
    const values = splitCsvRow(row);
    const record = Object.fromEntries(
      headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]),
    );

    return flexibleRecordToResult(record, index, sourceUrl);
  });
}

function parseHtmlResults(rawContent: string, sourceUrl: string): RawOfficialResult[] {
  const rowMatches = rawContent.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const rows = rowMatches.map((row) =>
    [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
      stripHtml(cell[1] ?? ""),
    ),
  );
  const [headersRaw, ...dataRows] = rows.filter((row) => row.length > 0);

  if (!headersRaw || dataRows.length === 0) {
    return [];
  }

  const headers = headersRaw.map(normalizeKey);

  return dataRows.map((row, index) => {
    const record = Object.fromEntries(
      headers.map((header, headerIndex) => [header, row[headerIndex] ?? ""]),
    );

    return flexibleRecordToResult(record, index, sourceUrl);
  });
}

function flexibleRecordToResult(
  row: FlexibleResultRecord,
  index: number,
  sourceUrl: string,
): RawOfficialResult {
  const rider = stringField(row, ["rider", "ridername", "name"]) ?? `Rider ${index + 1}`;
  const event = stringField(row, ["event", "eventname"]) ?? "Event TBC";
  const stage = stringField(row, ["stage", "classification", "session"]) ?? "Overall";

  return {
    externalId:
      stringField(row, ["externalid", "id", "uid"]) ??
      `${event}-${stage}-${index + 1}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    existingResultId: stringField(row, ["existingresultid"]),
    event,
    stage,
    rider,
    country: stringField(row, ["country", "nation", "nationality"]) ?? "Country TBC",
    team: stringField(row, ["team"]) ?? "Team TBC",
    manufacturer: stringField(row, ["manufacturer", "make"]) ?? "Manufacturer TBC",
    motorcycle: stringField(row, ["motorcycle", "bike", "model"]) ?? "Motorcycle TBC",
    position: numberField(row, ["position", "pos", "rank", "overallposition"]),
    time: stringField(row, ["time", "totaltime", "totaltimetext"]) ?? null,
    gapToLeader: stringField(row, ["gaptoleader", "leadergap", "gap"]) ?? null,
    gapToPrevious: stringField(row, ["gaptoprevious", "previousgap"]) ?? null,
    penalties: stringField(row, ["penalties", "penalty"]) ?? null,
    points: numberField(row, ["points", "pts"]),
    status: normalizeStatus(stringField(row, ["status"])),
    officialSourceUrl:
      stringField(row, ["officialsourceurl", "url", "sourceurl"]) ?? sourceUrl,
  };
}

function splitCsvRow(row: string) {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (const character of row) {
    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}

function stringField(row: FlexibleResultRecord, keys: string[]) {
  for (const key of keys) {
    const value = row[key] ?? row[normalizeKey(key)];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return undefined;
}

function numberField(row: FlexibleResultRecord, keys: string[]) {
  for (const key of keys) {
    const value = row[key] ?? row[normalizeKey(key)];

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string" && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return null;
}

function normalizeStatus(status?: string): OfficialResultStatus {
  const normalized = status?.toUpperCase();

  if (normalized === "DNF" || normalized === "DNS" || normalized === "DSQ") {
    return normalized;
  }

  return "Finished";
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}
