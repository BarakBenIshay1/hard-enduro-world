import { prisma } from "@/lib/prisma";

export async function getVideosPageData() {
  const mediaItems = await prisma.mediaItem.findMany({
    where: {
      type: "YOUTUBE",
    },
    orderBy: {
      publishedAt: "desc",
    },
    include: {
      event: true,
    },
  });

  return {
    mediaItems,
  };
}
