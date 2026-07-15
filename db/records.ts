import { prisma } from "@/lib/prisma";
import { publicResultWhere } from "@/lib/results/public-filters";

export type RecordCardData = {
  title: string;
  value: string;
  holder: string;
  href?: string;
  description: string;
};

export type RecordRankingRow = {
  id: string;
  label: string;
  value: number;
  href?: string;
  detail: string;
};

export async function getRecordsPageData() {
  const [standings, careerSeasons, results] = await prisma.$transaction([
    prisma.standing.findMany({
      include: {
        rider: {
          include: {
            country: true,
          },
        },
      },
    }),
    prisma.riderCareerSeason.findMany({
      include: {
        rider: {
          include: {
            country: true,
          },
        },
        manufacturer: true,
        motorcycle: {
          include: {
            manufacturer: true,
          },
        },
      },
    }),
    prisma.result.findMany({
      where: publicResultWhere,
      include: {
        rider: {
          include: {
            country: true,
          },
        },
        manufacturer: true,
        motorcycle: {
          include: {
            manufacturer: true,
          },
        },
      },
    }),
  ]);

  const riderWins = aggregateBy(
    standings,
    (standing) => standing.rider.id,
    (standing) => ({
      label: `${standing.rider.firstName} ${standing.rider.lastName}`,
      href: `/riders/${standing.rider.slug}`,
      detail: standing.rider.country?.name ?? "Country TBC",
    }),
    (standing) => standing.wins,
  );
  const riderPodiums = aggregateBy(
    standings,
    (standing) => standing.rider.id,
    (standing) => ({
      label: `${standing.rider.firstName} ${standing.rider.lastName}`,
      href: `/riders/${standing.rider.slug}`,
      detail: standing.rider.country?.name ?? "Country TBC",
    }),
    (standing) => standing.podiums,
  );
  const riderStarts = aggregateBy(
    standings,
    (standing) => standing.rider.id,
    (standing) => ({
      label: `${standing.rider.firstName} ${standing.rider.lastName}`,
      href: `/riders/${standing.rider.slug}`,
      detail: standing.rider.country?.name ?? "Country TBC",
    }),
    (standing) => standing.starts,
  );
  const riderDnfs = aggregateBy(
    standings,
    (standing) => standing.rider.id,
    (standing) => ({
      label: `${standing.rider.firstName} ${standing.rider.lastName}`,
      href: `/riders/${standing.rider.slug}`,
      detail: standing.rider.country?.name ?? "Country TBC",
    }),
    (standing) => standing.dnfs,
  );
  const riderChampionships = aggregateBy(
    careerSeasons.filter((career) => career.championshipPosition === 1),
    (career) => career.rider.id,
    (career) => ({
      label: `${career.rider.firstName} ${career.rider.lastName}`,
      href: `/riders/${career.rider.slug}`,
      detail: career.rider.country?.name ?? "Country TBC",
    }),
    () => 1,
  );
  const manufacturerWins = aggregateBy(
    results.filter((result) => result.overallPosition === 1 && result.manufacturer),
    (result) => result.manufacturer!.id,
    (result) => ({
      label: result.manufacturer!.name,
      href: `/manufacturers/${result.manufacturer!.slug}`,
      detail: "Manufacturer",
    }),
    () => 1,
  );
  const motorcycleWins = aggregateBy(
    results.filter((result) => result.overallPosition === 1 && result.motorcycle),
    (result) => result.motorcycle!.id,
    (result) => ({
      label: `${result.motorcycle!.manufacturer.name} ${result.motorcycle!.model}`,
      href: `/motorcycles/${result.motorcycle!.slug}`,
      detail: "Motorcycle",
    }),
    () => 1,
  );
  const countryWins = aggregateBy(
    results.filter((result) => result.overallPosition === 1 && result.rider.country),
    (result) => result.rider.country!.id,
    (result) => ({
      label: result.rider.country!.name,
      href: `/countries/${result.rider.country!.slug}`,
      detail: "Country",
    }),
    () => 1,
  );

  const recordCards: RecordCardData[] = [
    toRecordCard("Most wins", riderWins[0], "Highest seeded championship win count."),
    toRecordCard(
      "Most podiums",
      riderPodiums[0],
      "Highest seeded championship podium count.",
    ),
    toRecordCard(
      "Most championships",
      riderChampionships[0],
      "Most seeded championship markers.",
    ),
    toRecordCard("Most starts", riderStarts[0], "Most seeded championship starts."),
    toRecordCard("Most DNFs", riderDnfs[0], "Highest seeded DNF count."),
    toRecordCard(
      "Most successful manufacturer",
      manufacturerWins[0],
      "Most seeded event victories by manufacturer.",
    ),
    toRecordCard(
      "Most successful motorcycle",
      motorcycleWins[0],
      "Most seeded event victories by motorcycle.",
    ),
    toRecordCard(
      "Most successful country",
      countryWins[0],
      "Most seeded event victories by rider country.",
    ),
  ];

  return {
    recordCards,
    tables: {
      riderWins,
      riderPodiums,
      riderChampionships,
      riderStarts,
      riderDnfs,
      manufacturerWins,
      motorcycleWins,
      countryWins,
    },
    placeholders: ["Longest winning streak", "Youngest winner", "Oldest winner"],
  };
}

function aggregateBy<T>(
  rows: T[],
  getId: (row: T) => string,
  getMeta: (row: T) => { label: string; href?: string; detail: string },
  getValue: (row: T) => number,
) {
  const map = new Map<string, RecordRankingRow>();

  rows.forEach((row) => {
    const id = getId(row);
    const meta = getMeta(row);
    const current = map.get(id) ?? {
      id,
      label: meta.label,
      href: meta.href,
      detail: meta.detail,
      value: 0,
    };

    current.value += getValue(row);
    map.set(id, current);
  });

  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

function toRecordCard(
  title: string,
  row: RecordRankingRow | undefined,
  description: string,
) {
  return {
    title,
    value: String(row?.value ?? 0),
    holder: row?.label ?? "Pending data",
    href: row?.href,
    description,
  };
}
