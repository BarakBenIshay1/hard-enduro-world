import { createSlug } from "@/lib/slug";
import type { SourceConfidence } from "@/lib/source-intelligence";
import type {
  FimCalendarConfig,
  FimCalendarRaceStatusCandidate,
  NormalizedFimCalendarEventCandidate,
  RawFimCalendarItem,
} from "./types";

export function normalizeFimCalendarItems(
  items: RawFimCalendarItem[],
  config: FimCalendarConfig,
): NormalizedFimCalendarEventCandidate[] {
  return items
    .filter((item) => item.eventName)
    .map((item) => normalizeFimCalendarItem(item, config));
}

function normalizeFimCalendarItem(
  item: RawFimCalendarItem,
  config: FimCalendarConfig,
): NormalizedFimCalendarEventCandidate {
  const startDate = normalizeDate(item.startDate);
  const endDate = normalizeDate(item.endDate);
  const seasonYear =
    item.seasonYear ??
    (startDate ? new Date(startDate).getUTCFullYear() : config.seasonYear);
  const eventName = item.eventName?.trim() ?? "Unnamed FIM calendar event";

  return {
    sourceEventId: item.sourceEventId?.trim() || null,
    seasonYear,
    eventName,
    slugCandidate: `${createSlug(eventName)}-${seasonYear}`,
    country: item.country?.trim() || null,
    countryCode: item.countryCode?.trim().toUpperCase() || null,
    location: item.location?.trim() || null,
    venue: item.venue?.trim() || null,
    startDate,
    endDate,
    raceStatusCandidate: mapRaceStatus(item.status, startDate, endDate),
    startDatePrecision: getDatePrecision(item.startDate),
    endDatePrecision: getDatePrecision(item.endDate),
    officialUrl: item.officialUrl?.trim() || config.sourceUrl,
    sourceId: config.sourceId,
    confidence: createCalendarConfidence(config),
    reviewRequired: true,
    notes:
      item.notes ??
      "FIM calendar dry-run candidate. Calendar metadata only; no results, timing, standings, or sporting facts are produced.",
  };
}

function normalizeDate(value: string | null | undefined) {
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function getDatePrecision(
  value: string | null | undefined,
): NormalizedFimCalendarEventCandidate["startDatePrecision"] {
  if (!value) return "unknown";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{8}$/.test(value) ? "date" : "datetime";
}

function mapRaceStatus(
  status: string | null | undefined,
  startDate: string | null,
  endDate: string | null,
): FimCalendarRaceStatusCandidate {
  const normalized = status?.trim().toLowerCase();

  if (normalized?.includes("cancel")) return "Cancelled";
  if (normalized?.includes("postpone")) return "Postponed";
  if (normalized?.includes("suspend")) return "Suspended";
  if (normalized?.includes("live")) return "Live Now";
  if (normalized?.includes("complete") || normalized?.includes("finished")) {
    return "Race Completed";
  }
  if (
    normalized?.includes("scheduled") ||
    normalized?.includes("upcoming") ||
    normalized?.includes("coming soon")
  ) {
    return "Coming Soon";
  }

  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : start;

  if (!start || Number.isNaN(start.getTime())) return "Unknown";
  if (end && now > end) return "Race Completed";
  if (now >= start && (!end || now <= end)) return "Live Now";
  return "Coming Soon";
}

function createCalendarConfidence(config: FimCalendarConfig): SourceConfidence {
  return {
    level: config.source.confidenceLevel,
    score: config.source.priority === "critical" ? 0.9 : 0.8,
    reason:
      "Candidate comes from an authorized FIM calendar source in the production registry.",
  };
}
