import { Container } from "@/components/ui/container";
import type { VerifiedEventFact } from "@/data/verified/types";
import { Card } from "@/components/ui/card";
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
import { RaceStatusBadge } from "./RaceStatusBadge";
import { ResultsPanel } from "./ResultsPanel";
import { TimelinePanel } from "./TimelinePanel";
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
  const riderCards = isVerified ? buildRiderCards(event) : [];
  const manufacturerRows = isVerified ? buildManufacturerRows(event.results) : [];
  const teamRows = isVerified ? buildTeamRows(event.results) : [];
  const crossNavigation = isVerified
    ? buildCrossNavigation(event)
    : { riders: [], manufacturers: [], teams: [], motorcycles: [] };

  const resultsPanel = (
    <ResultsPanel event={event} verifiedFact={verifiedFact} isVerified={isVerified} />
  );
  const overviewPanel = (
    <RaceOverviewPanel
      verifiedFact={verifiedFact}
      podiumLabel={isVerified ? getPodiumLabel(event.results) : null}
      terrain={terrain}
      elevation={elevation}
    />
  );
  const participantsPanel = (
    <ParticipantsPanel
      verifiedFact={verifiedFact}
      riderCards={riderCards}
      manufacturerRows={manufacturerRows}
      teamRows={teamRows}
      crossNavigation={crossNavigation}
    />
  );
  const timelinePanel = (
    <TimelinePanel verifiedFact={verifiedFact} stageCards={stageCards} />
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

  if (raceStatus.phase === "coming-soon") {
    return (
      <Container className="grid gap-8 py-8">
        {overviewPanel}
        {timelinePanel}
        {participantsPanel}
        {resultsPanel}
        {historyPanel}
      </Container>
    );
  }

  if (raceStatus.phase === "live-now") {
    return (
      <Container className="grid gap-8 py-8">
        <LiveStatusPanel raceStatus={raceStatus} />
        {timelinePanel}
        {participantsPanel}
        {resultsPanel}
        {historyPanel}
      </Container>
    );
  }

  return (
    <Container className="grid gap-8 py-8">
      {resultsPanel}
      {overviewPanel}
      {participantsPanel}
      {timelinePanel}
      {historyPanel}
    </Container>
  );
}

function LiveStatusPanel({ raceStatus }: { raceStatus: RaceStatusView }) {
  return (
    <section id="live-now" className="scroll-mt-32">
      <Card className="border-red-500/30 bg-red-500/[0.08] p-5 shadow-[0_0_28px_hsl(0_84%_60%/0.14)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <RaceStatusBadge raceStatus={raceStatus} />
            <h2 className="mt-2 text-2xl font-black">Live coverage coming soon</h2>
          </div>
          <span className="inline-flex w-fit rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">
            No live data connected
          </span>
        </div>
      </Card>
    </section>
  );
}

function getPodiumLabel(results: EventDetail["results"]) {
  const podium = results
    .filter((result) => result.overallPosition !== null && result.overallPosition <= 3)
    .sort((a, b) => (a.overallPosition ?? 999) - (b.overallPosition ?? 999))
    .map((result) => winnerName(result.rider));

  return podium.length > 0 ? podium.join(" / ") : null;
}
