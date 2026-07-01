import { getRaceStatus } from "@/components/events/race-status";
import { prisma } from "@/lib/prisma";

export async function hasLiveRaceEvent() {
  try {
    const events = await prisma.event.findMany({
      select: {
        liveStatus: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });

    return events.some((event) => getRaceStatus(event).phase === "live-now");
  } catch {
    return false;
  }
}
