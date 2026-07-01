export type RacePhase = "coming-soon" | "live-now" | "race-completed";

export type RaceStatusView = {
  phase: RacePhase;
  label: "Coming Soon" | "Live Now" | "Race Completed";
};

type RaceStatusInput = {
  liveStatus?: string | null;
  status?: string | null;
  startDate: Date;
  endDate?: Date | null;
};

const liveValues = new Set(["LIVE", "LIVE_NOW", "IN_PROGRESS"]);
const completedValues = new Set(["FINISHED", "COMPLETED", "COMPLETE"]);

export function getRaceStatus(
  event: RaceStatusInput,
  now: Date = new Date(),
): RaceStatusView {
  const explicitStatus = [event.liveStatus, event.status]
    .filter(Boolean)
    .map((value) => String(value).toUpperCase());

  if (explicitStatus.some((status) => liveValues.has(status))) {
    return { phase: "live-now", label: "Live Now" };
  }

  if (explicitStatus.some((status) => completedValues.has(status))) {
    return { phase: "race-completed", label: "Race Completed" };
  }

  const startTime = event.startDate.getTime();
  const endTime = (event.endDate ?? event.startDate).getTime();
  const currentTime = now.getTime();

  if (currentTime > endTime) {
    return { phase: "race-completed", label: "Race Completed" };
  }

  if (currentTime >= startTime && currentTime <= endTime) {
    return { phase: "live-now", label: "Live Now" };
  }

  return { phase: "coming-soon", label: "Coming Soon" };
}

export function getRaceDashboardTabs(phase: RacePhase) {
  if (phase === "coming-soon") {
    return ["Race Overview", "Race Timeline", "Participants", "Results", "History"];
  }

  if (phase === "live-now") {
    return ["Live Now", "Race Timeline", "Participants", "Results", "History"];
  }

  return ["Results", "Race Overview", "Participants", "Race Timeline", "History"];
}
