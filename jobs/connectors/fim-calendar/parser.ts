import type {
  FimCalendarInputDiagnostics,
  FimCalendarInputCoverageMode,
  FimCalendarInputSourceType,
  FimCalendarParserSelected,
  RawFimCalendarItem,
} from "./types";

type FlexibleCalendarRecord = Record<string, unknown>;

export type ParsedFimCalendarPayload = {
  items: RawFimCalendarItem[];
  coverageMode: FimCalendarInputCoverageMode | null;
  inputSourceType: FimCalendarInputSourceType;
  diagnostics: Pick<
    FimCalendarInputDiagnostics,
    | "parserSelected"
    | "rawRecordsDetected"
    | "usableEventsParsed"
    | "recordsRejected"
    | "rejectionReasons"
  >;
};

export function parseFimCalendarPayload(rawContent: string): ParsedFimCalendarPayload {
  const trimmed = rawContent.trim();

  if (!trimmed) {
    return createParsedPayload([], null, "unknown", "unsupported", [
      "Source response was empty.",
    ]);
  }

  const jsonPayload = parseJsonCalendar(trimmed);
  if (jsonPayload.items.length > 0) {
    return createParsedPayload(
      jsonPayload.items,
      jsonPayload.coverageMode,
      "local-json",
      "json",
    );
  }

  if (looksLikeHtml(trimmed)) {
    const fimCalendarFragment = parseFimCalendarTableFragment(trimmed);
    if (fimCalendarFragment.rawRecordsDetected > 0) {
      return createParsedPayload(
        fimCalendarFragment.items,
        null,
        "local-html",
        "fim-solr-calendar-html",
        fimCalendarFragment.rejectionReasons,
        fimCalendarFragment.rawRecordsDetected,
      );
    }

    return createParsedPayload(
      parseHtmlCalendarSnapshot(trimmed),
      null,
      "local-html",
      "json-ld-html",
    );
  }

  return createParsedPayload(parseIcsCalendar(trimmed), null, "local-ics", "ics");
}

export function parseFimCalendarItems(items: RawFimCalendarItem[]) {
  return items.filter((item) => item.eventName && item.startDate);
}

function parseJsonCalendar(rawContent: string): {
  items: RawFimCalendarItem[];
  coverageMode: FimCalendarInputCoverageMode | null;
} {
  try {
    const parsed = JSON.parse(rawContent) as unknown;
    const rows = Array.isArray(parsed)
      ? parsed
      : typeof parsed === "object" &&
          parsed !== null &&
          Array.isArray((parsed as { events?: unknown }).events)
        ? (parsed as { events: unknown[] }).events
        : [];
    const coverageMode =
      typeof parsed === "object" &&
      parsed !== null &&
      isCoverageMode((parsed as { coverageMode?: unknown }).coverageMode)
        ? (parsed as { coverageMode: FimCalendarInputCoverageMode }).coverageMode
        : null;

    return {
      coverageMode,
      items: rows
        .filter(
          (row): row is FlexibleCalendarRecord => typeof row === "object" && row !== null,
        )
        .map(mapFlexibleRecord),
    };
  } catch {
    return { items: [], coverageMode: null };
  }
}

function mapFlexibleRecord(row: FlexibleCalendarRecord): RawFimCalendarItem {
  const location = objectField(row, "location");
  const address = objectField(location, "address") ?? objectField(row, "address");

  return {
    sourceEventId: stringField(row, ["sourceEventId", "externalId", "id", "uid", "@id"]),
    eventName: stringField(row, ["eventName", "name", "title"]),
    seasonYear: numberField(row, ["seasonYear", "season", "year"]),
    country:
      stringField(row, ["country", "countryName"]) ??
      stringField(address, ["addressCountry", "country"]),
    countryCode: stringField(row, ["countryCode", "iso", "isoCode"]),
    location:
      stringField(row, ["location", "city", "place"]) ??
      stringField(address, ["addressLocality", "addressRegion"]),
    venue:
      stringField(row, ["venue"]) ?? stringField(location, ["name", "venue", "place"]),
    startDate: stringField(row, ["startDate", "date", "start", "startsAt"]),
    endDate: stringField(row, ["endDate", "end", "endsAt"]),
    status: stringField(row, ["status", "eventStatus"]),
    officialUrl: stringField(row, ["officialUrl", "url", "link"]),
    notes: stringField(row, ["notes", "description"]),
  };
}

function parseIcsCalendar(rawContent: string): RawFimCalendarItem[] {
  const blocks = rawContent.split("BEGIN:VEVENT").slice(1);

  return blocks.map((block) => ({
    sourceEventId: icsField(block, "UID"),
    eventName: icsField(block, "SUMMARY"),
    country: null,
    countryCode: null,
    location: icsField(block, "LOCATION"),
    venue: icsField(block, "LOCATION"),
    startDate: parseIcsDate(icsField(block, "DTSTART")),
    endDate: parseIcsDate(icsField(block, "DTEND")),
    status: icsField(block, "STATUS"),
    officialUrl: icsField(block, "URL"),
    notes: null,
  }));
}

function parseFimCalendarTableFragment(rawContent: string): {
  items: RawFimCalendarItem[];
  rawRecordsDetected: number;
  rejectionReasons: string[];
} {
  const rows = [...rawContent.matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi)];
  const eventRows = rows
    .map((match) => ({ attributes: match[1] ?? "", html: match[2] ?? "" }))
    .filter((row) => /\bevent-\d+\b/.test(row.attributes));
  const rejectionReasons: string[] = [];
  const items = eventRows
    .map((row) => parseFimCalendarTableRow(row.attributes, row.html))
    .filter((item): item is RawFimCalendarItem => {
      if (!item) {
        rejectionReasons.push(
          "FIM calendar row rejected: missing title/date or outside Hard Enduro scope.",
        );
        return false;
      }
      return true;
    });

  return {
    items,
    rawRecordsDetected: eventRows.length,
    rejectionReasons,
  };
}

function parseFimCalendarTableRow(
  attributes: string,
  rowHtml: string,
): RawFimCalendarItem | null {
  const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(
    (match) => match[1] ?? "",
  );
  const startDateText = decodeHtml(stripTags(cells[0] ?? ""));
  const endDateText = decodeHtml(stripTags(cells[1] ?? ""));
  const imn = decodeHtml(stripTags(cells[2] ?? ""));
  const titleCell = cells[3] ?? "";
  const placeCell = cells[4] ?? "";
  const href = extractAttribute(titleCell, "href");
  const sourceEventId = attributes.match(/\bevent-(\d+)\b/)?.[1] ?? null;
  const officialTitle = decodeHtml(stripTags(titleCell));
  const titleParts = officialTitle
    .split(" - ")
    .map((part) => part.trim())
    .filter(Boolean);
  const eventName = titleParts.at(-1) ?? officialTitle;
  const countryFromTitle =
    titleParts.length >= 3 ? titleParts[titleParts.length - 2]?.split("/")[0] : null;
  const countryCode = extractAttribute(placeCell, "title");
  const location = decodeHtml(stripTags(placeCell));
  const startDate = parseFimTableDate(startDateText);
  const endDate = parseFimTableDate(endDateText, startDate);
  const status = /\bpast\b/.test(attributes) ? "Race Completed" : "Coming Soon";

  if (!/fim\s+hard\s+enduro\s+world\s+championship/i.test(officialTitle)) {
    return null;
  }

  if (!eventName || !startDate) return null;

  return {
    sourceEventId,
    eventName,
    country: countryFromTitle ?? null,
    countryCode,
    location,
    venue: location,
    startDate,
    endDate,
    status,
    officialUrl: href ? new URL(href, "https://www.fim-moto.com").href : null,
    notes: [
      `Official FIM calendar table row${imn ? `, IMN/NMFP ${imn}` : ""}.`,
      `Official title: ${officialTitle}.`,
    ].join(" "),
  };
}

function parseHtmlCalendarSnapshot(rawContent: string): RawFimCalendarItem[] {
  const jsonLdBlocks = [
    ...rawContent.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ]
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value));

  return jsonLdBlocks.flatMap((block) => {
    try {
      const parsed = JSON.parse(block) as unknown;
      const rows = flattenJsonLdRecords(parsed);
      return rows
        .filter(
          (row): row is FlexibleCalendarRecord => typeof row === "object" && row !== null,
        )
        .filter((row) => {
          const type = row["@type"];
          return type === "Event" || (Array.isArray(type) && type.includes("Event"));
        })
        .map((row) =>
          mapFlexibleRecord({
            ...row,
            eventName: row.name,
            startDate: row.startDate,
            endDate: row.endDate,
            officialUrl: row.url,
          }),
        );
    } catch {
      return [];
    }
  });
}

function flattenJsonLdRecords(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLdRecords);

  if (typeof value !== "object" || value === null) return [];

  const graph = (value as { "@graph"?: unknown })["@graph"];
  if (Array.isArray(graph)) return graph.flatMap(flattenJsonLdRecords);

  return [value];
}

function stringField(row: FlexibleCalendarRecord | null, keys: string[]) {
  if (!row) return null;

  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function numberField(row: FlexibleCalendarRecord | null, keys: string[]) {
  if (!row) return null;

  for (const key of keys) {
    const value = row[key];

    if (typeof value === "number") return value;
    if (typeof value === "string" && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return null;
}

function objectField(
  row: FlexibleCalendarRecord | null,
  key: string,
): FlexibleCalendarRecord | null {
  const value = row?.[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as FlexibleCalendarRecord)
    : null;
}

function icsField(block: string, field: string) {
  const line = block
    .split(/\r?\n/)
    .find((item) => item.startsWith(`${field}:`) || item.startsWith(`${field};`));

  return line?.slice(line.indexOf(":") + 1).trim() ?? null;
}

function parseIcsDate(value: string | null) {
  if (!value) return null;

  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00.000Z`;
  }

  if (/^\d{8}T\d{6}Z?$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}.000Z`;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function isCoverageMode(value: unknown): value is FimCalendarInputCoverageMode {
  return (
    value === "full-season" || value === "partial-season" || value === "single-event"
  );
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function createParsedPayload(
  items: RawFimCalendarItem[],
  coverageMode: FimCalendarInputCoverageMode | null,
  inputSourceType: FimCalendarInputSourceType,
  parserSelected: FimCalendarParserSelected,
  rejectionReasons: string[] = [],
  rawRecordsDetected = items.length,
): ParsedFimCalendarPayload {
  return {
    items,
    coverageMode,
    inputSourceType,
    diagnostics: {
      parserSelected,
      rawRecordsDetected,
      usableEventsParsed: items.length,
      recordsRejected: Math.max(
        rawRecordsDetected - items.length,
        rejectionReasons.length,
      ),
      rejectionReasons,
    },
  };
}

function parseFimTableDate(value: string, referenceDate?: string | null) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s*(\d{4})?$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = monthNumber(match[2]);
  const year = match[3] ?? (referenceDate ? referenceDate.slice(0, 4) : null);

  if (!day || !month || !year) return null;

  return `${year}-${month}-${String(day).padStart(2, "0")}`;
}

function monthNumber(value: string) {
  const months = new Map([
    ["jan", "01"],
    ["feb", "02"],
    ["mar", "03"],
    ["apr", "04"],
    ["may", "05"],
    ["jun", "06"],
    ["jul", "07"],
    ["aug", "08"],
    ["sep", "09"],
    ["oct", "10"],
    ["nov", "11"],
    ["dec", "12"],
  ]);

  return months.get(value.slice(0, 3).toLowerCase()) ?? null;
}

function stripTags(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function extractAttribute(value: string, attribute: string) {
  const pattern = new RegExp(`${attribute}=["']([^"']+)["']`, "i");
  return decodeHtml(value.match(pattern)?.[1] ?? "");
}
