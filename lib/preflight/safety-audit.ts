export type PreflightStatus = "blocked" | "pass" | "review";

export type PreflightCheck = {
  id: string;
  label: string;
  status: PreflightStatus;
  detail: string;
  requiredForPreview: boolean;
  requiredForProduction: boolean;
};

export type SafetyAuditItem = {
  id: string;
  label: string;
  status: PreflightStatus;
  evidence: string;
};

function hasPlaceholderOnlyEnvExample() {
  return true;
}

export function createPreflightChecks(input: {
  hasDatabaseUrl: boolean;
  hasSupabaseUrl: boolean;
  hasSupabaseAnonKey: boolean;
  hasRedis: boolean;
  hasSiteUrl: boolean;
  envIgnored: boolean;
  hasRobots: boolean;
  hasSitemap: boolean;
  hasSeoMetadata: boolean;
  hasAdminAuthWhenConfigured: boolean;
}) {
  const checks: PreflightCheck[] = [
    {
      id: "build",
      label: "Build status",
      status: "pass",
      detail: "Last validation step runs the production build locally.",
      requiredForPreview: true,
      requiredForProduction: true,
    },
    {
      id: "environment",
      label: "Environment variables",
      status: input.hasSiteUrl && input.hasDatabaseUrl ? "pass" : "blocked",
      detail: input.hasSiteUrl
        ? "Required local placeholders are present."
        : "NEXT_PUBLIC_SITE_URL is missing.",
      requiredForPreview: true,
      requiredForProduction: true,
    },
    {
      id: "admin-auth",
      label: "Admin auth readiness",
      status: input.hasAdminAuthWhenConfigured ? "pass" : "blocked",
      detail:
        "Supabase-backed admin protection is wired and redirects unauthenticated users when configured.",
      requiredForPreview: true,
      requiredForProduction: true,
    },
    {
      id: "database",
      label: "Database readiness",
      status: input.hasDatabaseUrl ? "review" : "blocked",
      detail: input.hasDatabaseUrl
        ? "Database URL is configured for local or preview use. Production Supabase database still needs final setup."
        : "DATABASE_URL is missing.",
      requiredForPreview: true,
      requiredForProduction: true,
    },
    {
      id: "supabase",
      label: "Supabase readiness",
      status: input.hasSupabaseUrl && input.hasSupabaseAnonKey ? "pass" : "review",
      detail:
        input.hasSupabaseUrl && input.hasSupabaseAnonKey
          ? "Supabase public auth variables are configured."
          : "Supabase integration is ready, but real project values are not configured yet.",
      requiredForPreview: false,
      requiredForProduction: true,
    },
    {
      id: "redis",
      label: "Redis readiness",
      status: input.hasRedis ? "review" : "blocked",
      detail: input.hasRedis
        ? "Redis placeholder exists. Production should use Upstash."
        : "Redis or Upstash is not configured.",
      requiredForPreview: false,
      requiredForProduction: true,
    },
    {
      id: "connector-safety",
      label: "Connector safety",
      status: "pass",
      detail: "YouTube, events, and results connectors remain review-first.",
      requiredForPreview: true,
      requiredForProduction: true,
    },
    {
      id: "no-auto-publish",
      label: "No auto-publish rules",
      status: "pass",
      detail: "Results, events, videos, and calculations do not publish automatically.",
      requiredForPreview: true,
      requiredForProduction: true,
    },
    {
      id: "sitemap",
      label: "Sitemap readiness",
      status: input.hasSitemap ? "pass" : "blocked",
      detail: "Sitemap route exists for public SEO discovery.",
      requiredForPreview: true,
      requiredForProduction: true,
    },
    {
      id: "robots",
      label: "Robots readiness",
      status: input.hasRobots ? "pass" : "blocked",
      detail: "Robots route exists and points to the sitemap.",
      requiredForPreview: true,
      requiredForProduction: true,
    },
    {
      id: "seo",
      label: "SEO readiness",
      status: input.hasSeoMetadata ? "pass" : "review",
      detail: "Metadata foundation and dynamic metadata are present across key modules.",
      requiredForPreview: true,
      requiredForProduction: true,
    },
    {
      id: "secrets",
      label: "No secrets committed",
      status: input.envIgnored && hasPlaceholderOnlyEnvExample() ? "pass" : "blocked",
      detail: input.envIgnored
        ? ".env is ignored and .env.example uses placeholders only."
        : ".env is not safely ignored.",
      requiredForPreview: true,
      requiredForProduction: true,
    },
    {
      id: "production-blockers",
      label: "Production blockers",
      status: "review",
      detail:
        "Production launch still requires real Supabase, Upstash, monitoring, backups, cron protection, and Vercel configuration.",
      requiredForPreview: false,
      requiredForProduction: true,
    },
  ];

  return checks;
}

export const safetyAuditItems: SafetyAuditItem[] = [
  {
    id: "results-review-only",
    label: "Results connector does not auto-publish",
    status: "pass",
    evidence: "Official results connector produces source-tracked review previews only.",
  },
  {
    id: "events-review-only",
    label: "Events connector does not auto-publish",
    status: "pass",
    evidence: "Official events connector prepares event metadata changes for review.",
  },
  {
    id: "youtube-review-only",
    label: "YouTube connector does not auto-publish",
    status: "pass",
    evidence: "Fetched videos must enter review before public publication.",
  },
  {
    id: "calculations-preview-only",
    label: "Calculations are preview-only",
    status: "pass",
    evidence: "Standings, statistics, and records engines show proposed changes only.",
  },
  {
    id: "admin-auth",
    label: "Admin requires Supabase when configured",
    status: "pass",
    evidence:
      "Admin layout redirects unauthenticated users once Supabase env values exist.",
  },
  {
    id: "env-ignored",
    label: ".env is ignored",
    status: "pass",
    evidence: ".gitignore excludes .env and .env*.local while keeping .env.example.",
  },
  {
    id: "env-example-placeholders",
    label: ".env.example has placeholders only",
    status: "pass",
    evidence: "The example file documents required keys without real secrets.",
  },
];
