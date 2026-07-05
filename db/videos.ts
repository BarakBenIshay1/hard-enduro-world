import { prisma } from "@/lib/prisma";

export async function getVideosPageData() {
  const [mediaItems, events] = await prisma.$transaction([
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
    prisma.event.findMany({
      orderBy: {
        startDate: "desc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return {
    mediaItems,
    events,
  };
}
