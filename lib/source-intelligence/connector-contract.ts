import type {
  ConnectorCapability,
  ConnectorResult,
  SourceSnapshot,
  SyncContext,
} from "./types";

export type SourceIntelligenceConnector = {
  id: string;
  capability: ConnectorCapability;
  createSnapshot(context: SyncContext): Promise<SourceSnapshot | null>;
  run(context: SyncContext): Promise<ConnectorResult>;
};

export function assertDryRunContext(context: SyncContext) {
  if (!context.dryRun) {
    throw new Error(
      "Source Intelligence connectors must run in dry-run mode until approval persistence is implemented.",
    );
  }
}
