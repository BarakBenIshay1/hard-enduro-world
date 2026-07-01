import { Container } from "@/components/ui/container";
import type { VerifiedEventFact } from "@/data/verified/types";
import {
  buildCrossNavigation,
  buildManufacturerRows,
  buildRiderCards,
  buildStageCard,
  buildTeamRows,
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
  terrain,
  elevation,
  previousWinner,
  finalWinner,
  fastestStage,
}: {
  event: EventDetail;
  verifiedFact: VerifiedEventFact;
  terrain: string;
  elevation: string;
  previousWinner: string;
  finalWinner: EventResult["rider"] | undefined;
  fastestStage: EventDetail["stages"][number]["stageResults"][number] | undefined;
}) {
  const stageCards = event.stages.map((stage) =>
    buildStageCard(stage, terrain, elevation),
  );
  const riderCards = buildRiderCards(event);
  const manufacturerRows = buildManufacturerRows(event.results);
  const teamRows = buildTeamRows(event.results);
  const crossNavigation = buildCrossNavigation(event);

  return (
    <Container className="grid gap-8 py-8">
      <ResultsPanel event={event} verifiedFact={verifiedFact} />
      <RaceOverviewPanel
        verifiedFact={verifiedFact}
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
