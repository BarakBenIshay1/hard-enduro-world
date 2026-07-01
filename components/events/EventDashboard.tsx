import { Container } from "@/components/ui/container";
import type { VerifiedEventFact } from "@/data/verified/types";
import { buildManufacturerRows, buildStageCard, winnerName } from "./helpers";
import { HistoryPanel } from "./HistoryPanel";
import { RaceOverviewPanel } from "./RaceOverviewPanel";
import { ResultsPanel } from "./ResultsPanel";
import type { RaceStatusView } from "./race-status";
import type { EventDetail, EventResult } from "./types";

export function EventDashboard({
  event,
  verifiedFact,
  isVerified,
  raceStatus,
  terrain,
  elevation,
  previousWinner,
  finalWinner,
  fastestStage,
}: {
  event: EventDetail;
  verifiedFact: VerifiedEventFact;
  isVerified: boolean;
  raceStatus: RaceStatusView;
  terrain: string;
  elevation: string;
  previousWinner: string;
  finalWinner: EventResult["rider"] | undefined;
  fastestStage: EventDetail["stages"][number]["stageResults"][number] | undefined;
}) {
  const stageCards = event.stages.map((stage) =>
    buildStageCard(stage, terrain, elevation),
  );
  const manufacturerRows = isVerified ? buildManufacturerRows(event.results) : [];

  const resultsPanel = (
    <ResultsPanel
      event={event}
      verifiedFact={verifiedFact}
      isVerified={isVerified}
      stageCards={stageCards}
      racePhase={raceStatus.phase}
    />
  );
  const overviewPanel = (
    <RaceOverviewPanel
      verifiedFact={verifiedFact}
      podiumLabel={isVerified ? getPodiumLabel(event.results) : null}
      terrain={terrain}
      elevation={elevation}
    />
  );
  const historyPanel = (
    <HistoryPanel
      event={event}
      verifiedFact={verifiedFact}
      fastestStage={fastestStage}
      manufacturerRows={manufacturerRows}
      previousWinner={previousWinner}
      finalWinner={finalWinner}
    />
  );

  return (
    <Container className="grid gap-8 py-8">
      {resultsPanel}
      {overviewPanel}
      {historyPanel}
    </Container>
  );
}

function getPodiumLabel(results: EventDetail["results"]) {
  const podium = results
    .filter((result) => result.overallPosition !== null && result.overallPosition <= 3)
    .sort((a, b) => (a.overallPosition ?? 999) - (b.overallPosition ?? 999))
    .map((result) => winnerName(result.rider));

  return podium.length > 0 ? podium.join(" / ") : null;
}
