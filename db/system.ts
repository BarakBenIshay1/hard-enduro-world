import { automationJobRegistry } from "@/jobs/automation/registry";
import { prisma } from "@/lib/prisma";

export async function getSystemAdminData() {
  const [
    sourceCount,
    pendingReviews,
    latestImportRun,
    latestCalculationRun,
    dataVersionCount,
  ] = await prisma.$transaction([
    prisma.dataSource.count(),
    prisma.importRun.count({
      where: {
        status: {
          in: ["PENDING", "NEEDS_REVIEW"],
        },
      },
    }),
    prisma.importRun.findFirst({
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
    prisma.importRun.findFirst({
      where: {
        OR: [
          {
            jobName: {
              contains: "recalculate",
              mode: "insensitive",
            },
          },
          {
            jobName: {
              contains: "calculation",
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: {
        startedAt: "desc",
      },
    }),
    prisma.dataVersion.count(),
  ]);

  return {
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? "local",
    nodeEnv: process.env.NODE_ENV ?? "development",
    appVersion: process.env.APP_VERSION ?? "0.1.0",
    databaseStatus: process.env.DATABASE_URL ? "Configured" : "Missing",
    redisStatus:
      process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL
        ? "Configured placeholder"
        : "Not configured",
    buildStatus: "Local build verified by CI/build scripts",
    deploymentStatus: "Not deployed from this app yet",
    sourceCount,
    pendingReviews,
    latestImportRun,
    latestCalculationRun,
    dataVersionCount,
    automationJobs: automationJobRegistry.length,
    enabledAutomationJobs: automationJobRegistry.filter((job) => job.enabled).length,
  };
}
