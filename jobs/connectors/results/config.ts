import type { ResultsConnectorConfig } from "@/jobs/connectors/results/types";

export function getResultsConnectorConfig(): ResultsConnectorConfig {
  return {
    sourceUrl: "https://www.fim-moto.com/sample-hard-enduro-results",
    eventExternalId: "hewc-2026-sample-hard-enduro-gp",
    reviewRequired: true,
    autoPublish: false,
  };
}
