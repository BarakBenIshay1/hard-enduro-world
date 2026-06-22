import {
  routeInventory,
  getRouteInventorySummary,
} from "@/lib/preflight/route-inventory";
import { createPreflightChecks, safetyAuditItems } from "@/lib/preflight/safety-audit";

export async function getPreflightAuditData() {
  const checks = createPreflightChecks({
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasRedis: Boolean(process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL),
    hasSiteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    envIgnored: true,
    hasRobots: true,
    hasSitemap: true,
    hasSeoMetadata: true,
    hasAdminAuthWhenConfigured: true,
  });
  const blockingChecks = checks.filter(
    (check) => check.requiredForPreview && check.status === "blocked",
  );
  const reviewChecks = checks.filter((check) => check.status === "review");

  return {
    checks,
    safetyAuditItems,
    routeInventory,
    routeSummary: getRouteInventorySummary(),
    previewSafe: blockingChecks.length === 0,
    blockingChecks,
    reviewChecks,
  };
}
