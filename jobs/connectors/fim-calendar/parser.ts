import type {
  FimCalendarInputCoverageMode,
  FimCalendarInputSourceType,
  RawFimCalendarItem,
} from "./types";

type FlexibleCalendarRecord = Record<string, unknown>;

export type ParsedFimCalendarPayload = {
  items: RawFimCalendarItem[];
  coverageMode: FimCalendarInputCoverageMode | null;
  inputSourceType: FimCalendarInputSourceType;
};

export function parseFimCalendarPayload(rawContent: string): ParsedFimCalendarPayload {
  const trimmed = rawContent.trim();

  if (!trimmed) {
    return { items: [], coverageMode: null, inputSourceType: "unknown" };
  }

  const jsonPayload = parseJsonCalendar(trimmed);
  if (jsonPayload.items.length > 0) {
    return { ...jsonPayload, inputSourceType: "local-json" };
  }

  if (looksLikeHtml(trimmed)) {
    return {
      items: parseHtmlCalendarSnapshot(trimmed),
      coverageMode: null,
      inputSourceType: "local-html",
    };
  }

  return {
    items: parseIcsCalendar(trimmed),
    coverageMode: null,
    inputSourceType: "local-ics",
  };
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
  return {
    sourceEventId: stringField(row, ["sourceEventId", "externalId", "id", "uid"]),
    eventName: stringField(row, ["eventName", "name", "title"]),
    seasonYear: numberField(row, ["seasonYear", "season", "year"]),
    country: stringField(row, ["country", "countryName"]),
    countryCode: stringField(row, ["countryCode", "iso", "isoCode"]),
    location: stringField(row, ["location", "city", "place"]),
    venue: stringField(row, ["venue"]),
    startDate: stringField(row, ["startDate", "date", "start", "startsAt"]),
    endDate: stringField(row, ["endDate", "end", "endsAt"]),
    status: stringField(row, ["status"]),
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
      const rows = Array.isArray(parsed) ? parsed : [parsed];
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

function stringField(row: FlexibleCalendarRecord, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function numberField(row: FlexibleCalendarRecord, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "number") return value;
    if (typeof value === "string" && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return null;
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
