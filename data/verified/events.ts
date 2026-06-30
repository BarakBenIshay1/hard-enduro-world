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
    sourceIds: ["red-bull-erzbergrodeo-official"],
    eventDescription: {
      value:
        "Red Bull Erzbergrodeo 2026 is the verified Erzbergrodeo event entry for Eisenerz, Austria. The current verified result scope is limited to the overall podium and finisher count.",
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes:
        "Built from the official-source registry entry, seeded event metadata, and the approved verified first-pass result facts.",
    },
    historySummary: {
      value: null,
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes:
        "Historical summary should be filled only from official Erzbergrodeo/FIM/Red Bull sources.",
    },
    terrainDescription: {
      value: null,
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes:
        "Terrain description pending official-source verification for the 2026 event page.",
    },
    elevation: {
      value: null,
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes: "Elevation pending official-source verification.",
    },
    distance: {
      value: null,
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes: "Distance pending official-source verification.",
    },
    checkpointCount: {
      value: null,
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes: "Checkpoint count pending official-source verification.",
    },
    eventFormat: {
      value: null,
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes: "Event format pending official-source verification.",
    },
    prologueExplanation: {
      value: null,
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes: "Prologue explanation pending official-source verification.",
    },
    mainRaceExplanation: {
      value: null,
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes: "Main race explanation pending official-source verification.",
    },
    finishRate: {
      value: null,
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes:
        "15 finishers are verified, but total starters are not verified in this seed, so percentage finish rate remains unknown.",
    },
    weather: {
      value: null,
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes: "Weather history pending official/weather-provider verification.",
    },
    officialOrganizer: {
      value: "Red Bull Erzbergrodeo",
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes: "Organizer label follows the official source registry entry.",
    },
    officialWebsite: {
      label: "Red Bull Erzbergrodeo official website",
      url: "https://www.redbullerzbergrodeo.com",
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes: "Official source registry URL.",
    },
    officialSocialLinks: [
      {
        label: "Official social links",
        url: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Official social links pending verification.",
      },
    ],
    officialYoutubeLinks: [
      {
        label: "Red Bull Motorsports YouTube",
        url: "https://www.youtube.com/@RedBullMotorsports",
        sourceIds: ["youtube-red-bull-motorsports"],
        notes: "Trusted media/video source only; not a source for official results.",
      },
    ],
    officialPdfPlaceholders: [
      {
        label: "Regulations PDF",
        url: null,
        sourceIds: ["official-event-pdfs"],
        notes: "Official PDF placeholder pending source URL.",
      },
      {
        label: "Entry list PDF",
        url: null,
        sourceIds: ["official-event-pdfs"],
        notes: "Official PDF placeholder pending source URL.",
      },
      {
        label: "Final classification PDF",
        url: null,
        sourceIds: ["official-event-pdfs"],
        notes: "Official PDF placeholder pending source URL.",
      },
    ],
    officialMediaGalleryPlaceholders: [
      {
        label: "Official media gallery",
        url: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Official media gallery placeholder pending source URL.",
      },
    ],
    officialDocumentPlaceholders: [
      {
        label: "Event documents",
        url: null,
        sourceIds: ["red-bull-erzbergrodeo-official", "official-event-pdfs"],
        notes: "Document center placeholder for verified official links only.",
      },
    ],
  },
];

export function getVerifiedEventFact(eventSlug: string) {
  return verifiedEventFacts.find((event) => event.eventSlug === eventSlug) ?? null;
}
