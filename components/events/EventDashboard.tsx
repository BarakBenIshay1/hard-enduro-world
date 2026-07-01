import { Container } from "@/components/ui/container";
import type { VerifiedEventFact } from "@/data/verified/types";
import {
  buildCrossNavigation,
  buildDocuments,
  buildManufacturerRows,
  buildMediaStats,
  buildOfficialLinks,
  buildRiderCards,
  buildStageCard,
  buildTeamRows,
  calculateVerifiedCoverage,
} from "./helpers";
import { HistoryPanel } from "./HistoryPanel";
import { ParticipantsPanel } from "./ParticipantsPanel";
import { RaceOverviewPanel } from "./RaceOverviewPanel";
import { ResourcesPanel } from "./ResourcesPanel";
import { ResultsPanel } from "./ResultsPanel";
import { SourceStatusCard } from "./SourceStatusCard";
import { TimelinePanel } from "./TimelinePanel";
import { VerificationCoverageCard } from "./VerificationCoverageCard";
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
  const coverage = calculateVerifiedCoverage(verifiedFact);
  const stageCards = event.stages.map((stage) =>
    buildStageCard(stage, terrain, elevation),
  );
  const riderCards = buildRiderCards(event);
  const manufacturerRows = buildManufacturerRows(event.results);
  const teamRows = buildTeamRows(event.results);
  const documents = buildDocuments(event);
  const mediaStats = buildMediaStats(event.mediaItems);
  const officialLinks = buildOfficialLinks(verifiedFact);
  const crossNavigation = buildCrossNavigation(event);

  return (
    <Container className="grid gap-8 py-8">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <SourceStatusCard eventFact={verifiedFact} />
        <VerificationCoverageCard coverage={coverage} />
      </section>

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
      <ResourcesPanel
        verifiedFact={verifiedFact}
        mediaStats={mediaStats}
        documents={documents}
        officialLinks={officialLinks}
      />
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
