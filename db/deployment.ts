import { automationJobRegistry } from "@/jobs/automation/registry";
import { createDeploymentReadinessReport } from "@/lib/deployment/readiness";
import { prisma } from "@/lib/prisma";

export async function getDeploymentReadinessData() {
  const [pendingReviews, sourceCount, latestImportRun] = await prisma.$transaction([
    prisma.importRun.count({
      where: {
        status: {
          in: ["PENDING", "NEEDS_REVIEW"],
        },
      },
    }),
    prisma.dataSource.count(),
    prisma.importRun.findFirst({
      orderBy: {
        startedAt: "desc",
      },
    }),
  ]);
  const appEnvironment =
    process.env.NEXT_PUBLIC_APP_ENV ?? process.env.VERCEL_ENV ?? "local";
  const report = createDeploymentReadinessReport({
    appEnvironment,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasProductionDatabase:
      appEnvironment === "production" &&
      Boolean(process.env.DATABASE_URL?.includes("supabase")),
    hasRedis: Boolean(process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL),
    hasSupabaseAuthProvider: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    hasCronSecret: Boolean(process.env.CRON_SECRET),
    hasMonitoring: process.env.MONITORING_ENABLED === "true",
    hasBackups: process.env.BACKUPS_CONFIRMED === "true",
    hasConnectors: true,
    hasCalculationEngines: true,
    hasAutomationRegistry: automationJobRegistry.length > 0,
    pendingReviews,
  });
  const envChecklist = [
    {
      label: "Site URL",
      configured: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      required: true,
    },
    {
      label: "Database URL",
      configured: Boolean(process.env.DATABASE_URL),
      required: true,
    },
    {
      label: "Supabase URL",
      configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      required: true,
    },
    {
      label: "Supabase anon key",
      configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      required: true,
    },
    {
      label: "Redis / Upstash",
      configured: Boolean(process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL),
      required: true,
    },
    {
      label: "Cron secret",
      configured: Boolean(process.env.CRON_SECRET),
      required: true,
    },
  ];
  const servicesChecklist = [
    { label: "Vercel project", configured: false, required: true },
    { label: "Supabase production database", configured: false, required: true },
    {
      label: "Upstash production Redis",
      configured: Boolean(process.env.UPSTASH_REDIS_REST_URL),
      required: true,
    },
    { label: "Monitoring provider", configured: false, required: true },
    { label: "Database backups", configured: false, required: true },
    { label: "Domain and SSL", configured: false, required: true },
  ];

  return {
    report,
    appEnvironment,
    sourceCount,
    pendingReviews,
    latestImportRun,
    currentDeploymentStatus: "Local/preview foundation only",
    buildStatus: "Last local production build passed in Step 24 validation",
    envChecklist,
    servicesChecklist,
  };
}
