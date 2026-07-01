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

export function getRaceDashboardTabs() {
  return ["Results", "Route Maps", "Race Overview", "History"];
}

export function getRaceStatusPriority(phase: RacePhase) {
  if (phase === "live-now") {
    return 0;
  }

  if (phase === "coming-soon") {
    return 1;
  }

  return 2;
}
