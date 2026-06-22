export type ReadinessStatus = "ready" | "partial" | "blocked";

export type ReadinessCheck = {
  id: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
  requiredForLaunch: boolean;
};

export type DeploymentReadinessInput = {
  appEnvironment: string;
  hasDatabaseUrl: boolean;
  hasProductionDatabase: boolean;
  hasRedis: boolean;
  hasSupabaseAuthProvider: boolean;
  hasCronSecret: boolean;
  hasMonitoring: boolean;
  hasBackups: boolean;
  hasConnectors: boolean;
  hasCalculationEngines: boolean;
  hasAutomationRegistry: boolean;
  pendingReviews: number;
};

export type DeploymentReadinessReport = {
  score: number;
  status: ReadinessStatus;
  summary: string;
  checks: ReadinessCheck[];
  blockers: ReadinessCheck[];
};

export function createDeploymentReadinessReport(
  input: DeploymentReadinessInput,
): DeploymentReadinessReport {
  const checks: ReadinessCheck[] = [
    {
      id: "environment",
      label: "Environment readiness",
      status: input.appEnvironment === "production" ? "ready" : "partial",
      detail:
        input.appEnvironment === "production"
          ? "Production environment marker is configured."
          : `Current environment is ${input.appEnvironment}. Production marker is not active.`,
      requiredForLaunch: true,
    },
    {
      id: "auth",
      label: "Auth readiness",
      status: input.hasSupabaseAuthProvider ? "ready" : "blocked",
      detail: input.hasSupabaseAuthProvider
        ? "Auth provider placeholders are configured."
        : "Real Supabase Auth or another login provider is not connected yet.",
      requiredForLaunch: true,
    },
    {
      id: "database",
      label: "Database readiness",
      status: input.hasProductionDatabase
        ? "ready"
        : input.hasDatabaseUrl
          ? "partial"
          : "blocked",
      detail: input.hasProductionDatabase
        ? "Production database marker appears configured."
        : input.hasDatabaseUrl
          ? "Database URL exists, but production database is not confirmed."
          : "Database URL is missing.",
      requiredForLaunch: true,
    },
    {
      id: "redis",
      label: "Redis readiness",
      status: input.hasRedis ? "ready" : "blocked",
      detail: input.hasRedis
        ? "Redis or Upstash placeholder is configured."
        : "Redis/Upstash is not configured.",
      requiredForLaunch: true,
    },
    {
      id: "cron",
      label: "Cron protection",
      status: input.hasCronSecret ? "ready" : "blocked",
      detail: input.hasCronSecret
        ? "Cron secret placeholder is configured."
        : "Cron protection secret is missing.",
      requiredForLaunch: true,
    },
    {
      id: "monitoring",
      label: "Monitoring",
      status: input.hasMonitoring ? "ready" : "blocked",
      detail: input.hasMonitoring
        ? "Monitoring placeholder is configured."
        : "Production monitoring is not configured yet.",
      requiredForLaunch: true,
    },
    {
      id: "backups",
      label: "Backups",
      status: input.hasBackups ? "ready" : "blocked",
      detail: input.hasBackups
        ? "Backup confirmation placeholder is configured."
        : "Production backup strategy is not confirmed yet.",
      requiredForLaunch: true,
    },
    {
      id: "automation",
      label: "Automation readiness",
      status: input.hasAutomationRegistry ? "partial" : "blocked",
      detail: input.hasAutomationRegistry
        ? "Automation registry exists, but jobs remain dry-run/review-only."
        : "Automation registry is missing.",
      requiredForLaunch: false,
    },
    {
      id: "connectors",
      label: "Connector readiness",
      status: input.hasConnectors ? "partial" : "blocked",
      detail: input.hasConnectors
        ? "Connector foundations exist, but real providers are not connected."
        : "Connector foundations are missing.",
      requiredForLaunch: false,
    },
    {
      id: "calculations",
      label: "Calculation readiness",
      status: input.hasCalculationEngines ? "partial" : "blocked",
      detail: input.hasCalculationEngines
        ? "Calculation engines exist, but outputs are preview-only."
        : "Calculation engines are missing.",
      requiredForLaunch: false,
    },
    {
      id: "reviews",
      label: "Review queue",
      status: input.pendingReviews === 0 ? "ready" : "partial",
      detail:
        input.pendingReviews === 0
          ? "No pending reviews detected."
          : `${input.pendingReviews} pending review item(s) need attention before launch.`,
      requiredForLaunch: false,
    },
  ];
  const blockers = checks.filter(
    (check) => check.requiredForLaunch && check.status === "blocked",
  );
  const weightedTotal = checks.reduce(
    (total, check) => total + (check.requiredForLaunch ? 2 : 1),
    0,
  );
  const weightedReady = checks.reduce((total, check) => {
    const weight = check.requiredForLaunch ? 2 : 1;
    const value =
      check.status === "ready" ? weight : check.status === "partial" ? weight / 2 : 0;

    return total + value;
  }, 0);
  const score = Math.round((weightedReady / weightedTotal) * 100);
  const status: ReadinessStatus =
    blockers.length > 0 ? "blocked" : score >= 90 ? "ready" : "partial";

  return {
    score,
    status,
    checks,
    blockers,
    summary:
      blockers.length > 0
        ? "Production launch is blocked by missing required services."
        : "Production launch foundation is close, pending final operational review.",
  };
}
