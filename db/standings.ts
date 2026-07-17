import { prisma } from "@/lib/prisma";

export async function getStandingsPageData() {
  const publications = await prisma.standingPublication.findMany({
    where: {
      status: "PUBLISHED",
      activeKey: { not: null },
    },
    orderBy: [{ season: { year: "desc" } }, { publishedAt: "desc" }],
    include: {
      season: { select: { id: true, name: true, year: true } },
    },
  });

  return {
    publications: publications.map((publication) => ({
      id: publication.id,
      season: publication.season,
      className: publication.className,
      publishedAt: publication.publishedAt,
      rows: parsePublishedRows(publication.rows),
    })),
  };
}

function parsePublishedRows(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item),
    )
    .map((row) => ({
      standingId: String(row.standingId ?? ""),
      seasonId: String(row.seasonId ?? ""),
      seasonName: String(row.seasonName ?? ""),
      className: typeof row.className === "string" ? row.className : null,
      position: numberOrNull(row.position),
      points: numberOrZero(row.points),
      wins: numberOrZero(row.wins),
      podiums: numberOrZero(row.podiums),
      starts: numberOrZero(row.starts),
      dnfs: numberOrZero(row.dnfs),
      riderName: String(row.riderName ?? "Unknown Rider"),
      riderSlug: String(row.riderSlug ?? ""),
      country: String(row.country ?? "Unknown"),
      countryCode: String(row.countryCode ?? "TBC"),
      team: String(row.team ?? "Independent"),
      manufacturer: String(row.manufacturer ?? "TBC"),
      motorcycle: String(row.motorcycle ?? "TBC"),
    }));
}

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
