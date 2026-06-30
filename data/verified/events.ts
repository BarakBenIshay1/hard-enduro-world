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
    review: {
      lastReviewed: "2026-06-30",
      confidence: "high",
      sourceIds: ["red-bull-erzbergrodeo-official"],
      notes:
        "Reviewed as a first-pass verified event control center. Unknown fields remain placeholders until official source material is attached.",
    },
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
    participants: {
      registeredRiders: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Registered rider count pending official entry-list verification.",
      },
      confirmedStarters: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Confirmed starters pending official start-list verification.",
      },
      verifiedFinishers: {
        value: "15",
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes:
          "Verified first-pass finisher count. Full finisher identities remain pending official classification verification.",
      },
      dnf: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "DNF count pending official classification verification.",
      },
      dns: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "DNS count pending official classification verification.",
      },
      dsq: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "DSQ count pending official classification verification.",
      },
    },
    manufacturerContext: {
      factoryParticipation: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Factory participation requires official paddock or entry-list source.",
      },
      participatingManufacturers: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes:
          "Full manufacturer participation pending official entry-list verification. Podium-linked manufacturer records may appear separately when already connected to verified result rows.",
      },
      factoryRiders: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Factory rider classification pending official source verification.",
      },
      privateRiders: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Private rider classification pending official source verification.",
      },
    },
    teamContext: {
      factoryTeams: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Factory teams pending official entry-list verification.",
      },
      independentTeams: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Independent teams pending official entry-list verification.",
      },
      supportTeams: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Support teams pending official paddock/source verification.",
      },
    },
    motorcycleContext: {
      motorcycleModels: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes:
          "Motorcycle models require verified entry-list or official team/manufacturer source.",
      },
      engineSize: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Engine sizes pending verified motorcycle source data.",
      },
      manufacturer: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes:
          "Motorcycle manufacturer participation pending official source verification.",
      },
    },
    raceStatistics: {
      starters: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Starter count pending official start-list verification.",
      },
      finishers: {
        value: "15",
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Verified first-pass finisher count.",
      },
      finishRate: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes:
          "Finish rate requires both verified starter count and verified finisher count.",
      },
      longestStage: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Longest stage pending official course data.",
      },
      totalDistance: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Total distance pending official course data.",
      },
      elevationGain: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Elevation gain pending official course data.",
      },
      checkpointCount: {
        value: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Checkpoint count pending official course data.",
      },
    },
    eventTimeline: [
      {
        label: "Registration",
        date: null,
        status: "Pending verification",
        description: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Registration dates pending official schedule verification.",
      },
      {
        label: "Prologue",
        date: null,
        status: "Pending verification",
        description: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Prologue schedule pending official verification.",
      },
      {
        label: "Main Race",
        date: null,
        status: "Pending verification",
        description: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Main-race schedule pending official verification.",
      },
      {
        label: "Awards",
        date: null,
        status: "Pending verification",
        description: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Awards timing pending official verification.",
      },
      {
        label: "Official media release",
        date: null,
        status: "Pending verification",
        description: null,
        sourceIds: ["red-bull-erzbergrodeo-official"],
        notes: "Official media release timing pending source verification.",
      },
      {
        label: "Official results publication",
        date: null,
        status: "Pending verification",
        description: null,
        sourceIds: ["red-bull-erzbergrodeo-official", "official-event-pdfs"],
        notes:
          "Official results publication pending source URL and document verification.",
      },
    ],
  },
];

export function getVerifiedEventFact(eventSlug: string) {
  return verifiedEventFacts.find((event) => event.eventSlug === eventSlug) ?? null;
}
