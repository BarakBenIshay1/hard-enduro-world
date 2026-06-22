import { automationJobRegistry } from "@/jobs/automation/registry";
import { prisma } from "@/lib/prisma";

export async function getAutomationDashboardData() {
  const [importRuns, pendingImports, failedImports, successfulRuns] =
    await prisma.$transaction([
      prisma.importRun.findMany({
        orderBy: {
          startedAt: "desc",
        },
        take: 8,
        include: {
          sourceSnapshot: {
            include: {
              dataSource: true,
            },
          },
        },
      }),
      prisma.importRun.count({
        where: {
          status: {
            in: ["PENDING", "NEEDS_REVIEW"],
          },
        },
      }),
      prisma.importRun.count({
        where: {
          status: "FAILED",
        },
      }),
      prisma.importRun.count({
        where: {
          status: "COMPLETED",
        },
      }),
    ]);

  const activeJobs = automationJobRegistry.filter((job) => job.enabled).length;
  const pausedJobs = automationJobRegistry.filter((job) => !job.enabled).length;
  const latestRun = importRuns[0] ?? null;
  const lastSuccessfulRun =
    importRuns.find((run) => run.status === "COMPLETED")?.finishedAt ??
    importRuns.find((run) => run.status === "COMPLETED")?.startedAt ??
    null;

  return {
    jobs: automationJobRegistry,
    importRuns,
    overview: {
      activeJobs,
      pausedJobs,
      failedJobs: failedImports,
      successfulRuns,
      pendingImports,
      lastRunTime: latestRun?.startedAt ?? null,
      lastSuccessfulImport: lastSuccessfulRun,
      nextScheduledRun: "Schedule placeholder",
      healthStatus: failedImports > 0 ? "Needs attention" : "Healthy",
    },
  };
}

export async function getAutomationImportsData() {
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
      changes: true,
    },
  });

  return { importRuns };
}
