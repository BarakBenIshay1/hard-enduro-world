import { prisma } from "@/lib/prisma";
import { validateOfficialRegulation } from "@/lib/regulations/championship-regulations";

export async function getAdminRegulations() {
  const regulations = await prisma.championshipRegulation.findMany({
    orderBy: [{ regulationYear: "desc" }, { updatedAt: "desc" }],
    include: {
      season: { select: { id: true, name: true, year: true } },
      sourceSnapshot: { select: { id: true, fetchedAt: true, contentHash: true } },
    },
  });

  return regulations.map((regulation) => ({
    ...regulation,
    validationIssues: validateOfficialRegulation(regulation),
  }));
}

export async function getRegulationFormOptions() {
  const [seasons, sourceSnapshots] = await Promise.all([
    prisma.season.findMany({
      orderBy: { year: "desc" },
      select: { id: true, name: true, year: true },
    }),
    prisma.sourceSnapshot.findMany({
      orderBy: { fetchedAt: "desc" },
      take: 50,
      select: { id: true, url: true, contentHash: true, fetchedAt: true },
    }),
  ]);
  return { seasons, sourceSnapshots };
}

export async function getAdminRegulationDetail(id: string) {
  const regulation = await prisma.championshipRegulation.findUnique({
    where: { id },
    include: {
      season: { select: { id: true, name: true, year: true } },
      sourceSnapshot: {
        select: { id: true, fetchedAt: true, contentHash: true, url: true },
      },
    },
  });
  if (!regulation) return null;
  const versions = await prisma.dataVersion.findMany({
    where: { entityType: "ChampionshipRegulation", entityId: regulation.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const relatedProposals = await prisma.connectorReviewItem.findMany({
    where: {
      connectorKey: "official-regulation-points",
      OR: [
        { proposedValues: { path: ["regulationId"], equals: regulation.id } },
        { currentValues: { path: ["regulationId"], equals: regulation.id } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      suggestedAction: true,
      reviewStatus: true,
      applicationStatus: true,
      createdAt: true,
      appliedAt: true,
    },
  });
  const relatedStandingCalculations = await prisma.connectorSnapshot.findMany({
    where: {
      connectorKey: "standings-calculation",
      normalizedPayload: {
        path: ["pointsRule", "officialRegulationReference"],
        array_contains: [{ id: regulation.id }],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, payloadChecksum: true, createdAt: true },
  });
  return {
    ...regulation,
    validationIssues: validateOfficialRegulation(regulation),
    versions,
    relatedProposals,
    relatedStandingCalculations,
  };
}
