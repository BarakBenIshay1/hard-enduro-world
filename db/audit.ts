import { prisma } from "@/lib/prisma";

export async function getAuditLogData() {
  const versions = await prisma.dataVersion.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      importRun: {
        include: {
          sourceSnapshot: {
            include: {
              dataSource: true,
            },
          },
        },
      },
    },
  });

  return { versions };
}
