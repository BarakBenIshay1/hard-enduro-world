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
