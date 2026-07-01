import { Container } from "@/components/ui/container";
import type { VerifiedEventFact } from "@/data/verified/types";
import {
  buildCrossNavigation,
  buildManufacturerRows,
  buildRiderCards,
  buildStageCard,
  buildTeamRows,
  winnerName,
} from "./helpers";
import { HistoryPanel } from "./HistoryPanel";
import { ParticipantsPanel } from "./ParticipantsPanel";
import { RaceOverviewPanel } from "./RaceOverviewPanel";
import { ResultsPanel } from "./ResultsPanel";
import { TimelinePanel } from "./TimelinePanel";
import type { EventDetail, EventResult } from "./types";

export function EventDashboard({
  event,
  verifiedFact,
  isVerified,
  terrain,
  elevation,
  previousWinner,
  finalWinner,
  fastestStage,
}: {
  event: EventDetail;
  verifiedFact: VerifiedEventFact;
  isVerified: boolean;
  terrain: string;
  elevation: string;
  previousWinner: string;
  finalWinner: EventResult["rider"] | undefined;
  fastestStage: EventDetail["stages"][number]["stageResults"][number] | undefined;
}) {
  const stageCards = event.stages.map((stage) =>
    buildStageCard(stage, terrain, elevation),
  );
  const riderCards = isVerified ? buildRiderCards(event) : [];
  const manufacturerRows = isVerified ? buildManufacturerRows(event.results) : [];
  const teamRows = isVerified ? buildTeamRows(event.results) : [];
  const crossNavigation = isVerified
    ? buildCrossNavigation(event)
    : { riders: [], manufacturers: [], teams: [], motorcycles: [] };

  return (
    <Container className="grid gap-8 py-8">
      <ResultsPanel event={event} verifiedFact={verifiedFact} isVerified={isVerified} />
      <RaceOverviewPanel
        verifiedFact={verifiedFact}
        podiumLabel={isVerified ? getPodiumLabel(event.results) : null}
        terrain={terrain}
        elevation={elevation}
      />
      <ParticipantsPanel
        verifiedFact={verifiedFact}
        riderCards={riderCards}
        manufacturerRows={manufacturerRows}
        teamRows={teamRows}
        crossNavigation={crossNavigation}
      />
      <TimelinePanel verifiedFact={verifiedFact} stageCards={stageCards} />
      <HistoryPanel
        event={event}
        verifiedFact={verifiedFact}
        fastestStage={fastestStage}
        manufacturerRows={manufacturerRows}
        previousWinner={previousWinner}
        finalWinner={finalWinner}
      />
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
