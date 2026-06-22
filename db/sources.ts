import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getSourcesAdminData() {
  const sources = await prisma.dataSource.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      snapshots: {
        orderBy: {
          fetchedAt: "desc",
        },
        take: 1,
        include: {
          importRuns: {
            orderBy: {
              startedAt: "desc",
            },
            take: 1,
          },
        },
      },
      links: true,
    },
  });

  return { sources };
}

export async function getSourceDetail(id: string) {
  const source = await prisma.dataSource.findUnique({
    where: { id },
    include: {
      links: {
        orderBy: {
          createdAt: "desc",
        },
      },
      snapshots: {
        orderBy: {
          fetchedAt: "desc",
        },
        include: {
          importRuns: {
            orderBy: {
              startedAt: "desc",
            },
            include: {
              changes: {
                orderBy: {
                  createdAt: "desc",
                },
              },
            },
          },
        },
      },
    },
  });

  if (!source) {
    notFound();
  }

  return source;
}

export async function getImportReviewData() {
  const importRuns = await prisma.importRun.findMany({
    orderBy: {
      startedAt: "desc",
    },
    include: {
      sourceSnapshot: {
        include: {
          dataSource: true,
        },
      },
      changes: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  return { importRuns };
}
