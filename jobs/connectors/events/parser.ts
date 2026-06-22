import type { RawOfficialEvent } from "@/jobs/connectors/events/types";

export function parseOfficialEventsPlaceholder(
  events: RawOfficialEvent[],
): RawOfficialEvent[] {
  return events.filter(
    (event) =>
      event.externalId &&
      event.name &&
      event.seasonYear &&
      event.startDate &&
      event.countryName &&
      event.officialUrl,
  );
}

export function parseOfficialEventsPayload(
  rawContent: string,
  fallbackSeasonYear: number,
  sourceUrl: string,
): RawOfficialEvent[] {
  const trimmed = rawContent.trim();

  if (!trimmed) {
    return [];
  }

  const jsonEvents = parseJsonEvents(trimmed, fallbackSeasonYear, sourceUrl);

  if (jsonEvents.length > 0) {
    return parseOfficialEventsPlaceholder(jsonEvents);
  }

  return parseOfficialEventsPlaceholder(
    parseIcsEvents(trimmed, fallbackSeasonYear, sourceUrl),
  );
}

type FlexibleEventRecord = Record<string, unknown>;

function parseJsonEvents(
  rawContent: string,
  fallbackSeasonYear: number,
  sourceUrl: string,
): RawOfficialEvent[] {
  try {
    const parsed = JSON.parse(rawContent) as unknown;
    const rows = Array.isArray(parsed)
      ? parsed
      : typeof parsed === "object" &&
          parsed !== null &&
          Array.isArray((parsed as { events?: unknown }).events)
        ? (parsed as { events: unknown[] }).events
        : [];

    return rows
      .filter(
        (row): row is FlexibleEventRecord => typeof row === "object" && row !== null,
      )
      .map((row, index) =>
        flexibleRecordToEvent(row, index, fallbackSeasonYear, sourceUrl),
      );
  } catch {
    return [];
  }
}

function flexibleRecordToEvent(
  row: FlexibleEventRecord,
  index: number,
  fallbackSeasonYear: number,
  sourceUrl: string,
): RawOfficialEvent {
  const name =
    stringField(row, ["name", "title", "eventName"]) ?? `Official Event ${index + 1}`;
  const startDate =
    stringField(row, ["startDate", "date", "start", "startsAt"]) ??
    new Date().toISOString();
  const seasonYear =
    numberField(row, ["seasonYear", "season", "year"]) ??
    new Date(startDate).getUTCFullYear() ??
    fallbackSeasonYear;

  return {
    externalId:
      stringField(row, ["externalId", "id", "uid"]) ??
      `${seasonYear}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    seasonYear,
    startDate,
    endDate: stringField(row, ["endDate", "end", "endsAt"]),
    countryName: stringField(row, ["countryName", "country"]) ?? "Country TBC",
    countryCode: stringField(row, ["countryCode", "isoCode", "iso"]) ?? "TBC",
    city: stringField(row, ["city", "locationCity"]),
    venue: stringField(row, ["venue", "location", "place"]),
    status: normalizeStatus(stringField(row, ["status"])),
    officialUrl: stringField(row, ["officialUrl", "url", "link"]) ?? sourceUrl,
  };
}

function parseIcsEvents(
  rawContent: string,
  fallbackSeasonYear: number,
  sourceUrl: string,
): RawOfficialEvent[] {
  const blocks = rawContent.split("BEGIN:VEVENT").slice(1);

  return blocks.map((block, index) => {
    const name = icsField(block, "SUMMARY") ?? `Official Event ${index + 1}`;
    const startDate =
      parseIcsDate(icsField(block, "DTSTART")) ?? new Date().toISOString();
    const endDate = parseIcsDate(icsField(block, "DTEND"));
    const location = icsField(block, "LOCATION") ?? "";
    const seasonYear = new Date(startDate).getUTCFullYear() || fallbackSeasonYear;

    return {
      externalId: icsField(block, "UID") ?? `${seasonYear}-${index + 1}-${name}`,
      name,
      seasonYear,
      startDate,
      endDate,
      countryName: "Country TBC",
      countryCode: "TBC",
      city: location.split(",")[0]?.trim() || undefined,
      venue: location,
      status: normalizeStatus(icsField(block, "STATUS")),
      officialUrl: icsField(block, "URL") ?? sourceUrl,
    };
  });
}

function stringField(row: FlexibleEventRecord, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function numberField(row: FlexibleEventRecord, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string" && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return undefined;
}

function normalizeStatus(status?: string): RawOfficialEvent["status"] {
  const normalized = status?.toUpperCase();

  if (
    normalized === "LIVE" ||
    normalized === "SUSPENDED" ||
    normalized === "COMPLETED" ||
    normalized === "CANCELLED"
  ) {
    return normalized;
  }

  return "SCHEDULED";
}

function icsField(block: string, field: string) {
  const line = block
    .split(/\r?\n/)
    .find((item) => item.startsWith(`${field}:`) || item.startsWith(`${field};`));

  return line?.slice(line.indexOf(":") + 1).trim();
}

function parseIcsDate(value?: string) {
  if (!value) {
    return undefined;
  }

  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00.000Z`;
  }

  if (/^\d{8}T\d{6}Z?$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}.000Z`;
  }

  return new Date(value).toISOString();
}
