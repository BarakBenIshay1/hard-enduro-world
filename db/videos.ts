import { previewYouTubeImport } from "@/jobs/connectors/youtube";
import { prisma } from "@/lib/prisma";

export async function getVideosPageData() {
  const [mediaItems, preview] = await Promise.all([
    prisma.mediaItem.findMany({
      where: {
        type: "YOUTUBE",
      },
      orderBy: {
        publishedAt: "desc",
      },
      include: {
        event: true,
      },
    }),
    previewYouTubeImport(),
  ]);

  return {
    mediaItems,
    previewVideos: preview.normalizedVideos,
  };
}

export async function getYouTubeJobAdminData() {
  const [preview, importRuns, source] = await Promise.all([
    previewYouTubeImport(),
    prisma.importRun.findMany({
      where: {
        OR: [
          {
            jobName: {
              contains: "youtube",
              mode: "insensitive",
            },
          },
          {
            sourceSnapshot: {
              dataSource: {
                type: "YOUTUBE",
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
    }),
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
    preview,
    importRuns,
    source,
  };
}
