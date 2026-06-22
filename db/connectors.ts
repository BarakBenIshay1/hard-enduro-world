import { previewOfficialEventsImport } from "@/jobs/connectors/events";
import { previewYouTubeImport } from "@/jobs/connectors/youtube";
import { prisma } from "@/lib/prisma";

export async function getConnectorJobAdminData(jobId: string) {
  if (jobId === "youtube-videos") {
    const [preview, importRuns, source] = await Promise.all([
      previewYouTubeImport(),
      getImportRunsForConnector("youtube", "YOUTUBE"),
      prisma.dataSource.findFirst({
        where: {
          type: "YOUTUBE",
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return {
      kind: "youtube" as const,
      source,
      importRuns,
      preview,
    };
  }

  if (jobId === "official-events") {
    const [preview, importRuns, source] = await Promise.all([
      previewOfficialEventsImport(),
      getImportRunsForConnector("official-events", "OFFICIAL_WEBSITE"),
      prisma.dataSource.findFirst({
        where: {
          type: "OFFICIAL_WEBSITE",
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return {
      kind: "events" as const,
      source,
      importRuns,
      preview,
    };
  }

  return null;
}

function getImportRunsForConnector(
  jobNameFragment: string,
  sourceType: "YOUTUBE" | "OFFICIAL_WEBSITE",
) {
  return prisma.importRun.findMany({
    where: {
      OR: [
        {
          jobName: {
            contains: jobNameFragment,
            mode: "insensitive",
          },
        },
        {
          sourceSnapshot: {
            dataSource: {
              type: sourceType,
            },
          },
        },
      ],
    },
    orderBy: {
      startedAt: "desc",
    },
    include: {
      sourceSnapshot: {
        include: {
          dataSource: true,
        },
      },
    },
  });
}
