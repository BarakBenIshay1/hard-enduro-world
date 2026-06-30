import type { VerifiedEventFact } from "./types";

export const verifiedEventFacts: VerifiedEventFact[] = [
  {
    eventSlug: "erzbergrodeo-2026",
    displayName: "Red Bull Erzbergrodeo 2026",
    previousWinner: "Manuel Lettenbichler",
    verifiedWinner: "Manuel Lettenbichler",
    verifiedFinisherCount: 15,
    factsNote:
      "Red Bull Erzbergrodeo 2026 first-pass verified facts: Manuel Lettenbichler won, the podium was Manuel Lettenbichler, Trystan Hart, Mario Roman, 15 riders reached the finish, and Billy Bolt is not listed as a finisher. Exact timing, gaps, penalties, and points are not verified here.",
    sourceIds: ["erzbergrodeo-2026-manual-first-pass"],
  },
];

export function getVerifiedEventFact(eventSlug: string) {
  return verifiedEventFacts.find((event) => event.eventSlug === eventSlug) ?? null;
}
