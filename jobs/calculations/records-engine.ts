import type { LeaderboardRow } from "@/jobs/calculations/leaderboards";
import { topValue } from "@/jobs/calculations/leaderboards";
import type { StatisticsPreview } from "@/jobs/calculations/statistics-engine";

export type ChampionshipCareerInput = {
  riderId: string;
  riderName: string;
  riderHref?: string;
  championships: number;
};

export type RecordPreview = {
  key: string;
  title: string;
  holder: string;
  value: string;
  detail: string;
  href?: string;
  placeholder: boolean;
};

export type RecordsPreview = {
  records: RecordPreview[];
};

export function previewRecordsCalculation({
  statistics,
  championshipCareers,
}: {
  statistics: StatisticsPreview;
  championshipCareers: ChampionshipCareerInput[];
}): RecordsPreview {
  const championshipRows: LeaderboardRow[] = championshipCareers
    .map((career) => ({
      id: career.riderId,
      label: career.riderName,
      href: career.riderHref,
      value: career.championships,
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

  return {
    records: [
      toRecord("most-wins", "Most wins", topValue(statistics.leaderboards.riderWins)),
      toRecord(
        "most-podiums",
        "Most podiums",
        topValue(statistics.leaderboards.riderPodiums),
      ),
      toRecord("most-championships", "Most championships", topValue(championshipRows)),
      toRecord(
        "most-starts",
        "Most starts",
        topValue(statistics.leaderboards.riderStarts),
      ),
      toRecord("most-dnfs", "Most DNFs", topValue(statistics.leaderboards.riderDnfs)),
      toRecord(
        "most-successful-manufacturer",
        "Most successful manufacturer",
        topValue(statistics.leaderboards.manufacturerWins),
      ),
      toRecord(
        "most-successful-motorcycle",
        "Most successful motorcycle",
        topValue(statistics.leaderboards.motorcycleWins),
      ),
      toRecord(
        "most-successful-country",
        "Most successful country",
        topValue(statistics.leaderboards.countryWins),
      ),
      placeholderRecord("longest-winning-streak", "Longest winning streak"),
      placeholderRecord("youngest-winner", "Youngest winner"),
      placeholderRecord("oldest-winner", "Oldest winner"),
    ],
  };
}

function toRecord(key: string, title: string, row: LeaderboardRow | null): RecordPreview {
  return {
    key,
    title,
    holder: row?.label ?? "Pending data",
    value: String(row?.value ?? 0),
    detail: row?.detail ?? "Preview calculated from approved-result-style demo data.",
    href: row?.href,
    placeholder: false,
  };
}

function placeholderRecord(key: string, title: string): RecordPreview {
  return {
    key,
    title,
    holder: "Placeholder",
    value: "Pending",
    detail: "Prepared for future complete historical data and date-aware logic.",
    placeholder: true,
  };
}
