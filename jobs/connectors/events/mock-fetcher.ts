import type {
  OfficialEventsFetchResult,
  RawOfficialEvent,
} from "@/jobs/connectors/events/types";

export async function fetchOfficialEventsDemo(): Promise<RawOfficialEvent[]> {
  return [
    {
      externalId: "hewc-2026-sample-hard-enduro-gp",
      name: "Sample Hard Enduro GP",
      seasonYear: 2026,
      startDate: "2026-06-01T08:00:00.000Z",
      endDate: "2026-06-03T18:00:00.000Z",
      countryName: "Austria",
      countryCode: "AT",
      city: "Eisenerz",
      venue: "Iron Mountain",
      status: "SCHEDULED",
      officialUrl: "https://iridehardenduro.com/sample-hard-enduro-gp-2026",
    },
    {
      externalId: "hewc-2026-demo-sea-to-sky",
      name: "Demo Sea to Sky",
      seasonYear: 2026,
      startDate: "2026-10-08T08:00:00.000Z",
      endDate: "2026-10-10T18:00:00.000Z",
      countryName: "Turkey",
      countryCode: "TR",
      city: "Kemer",
      venue: "Sea to Sky course",
      status: "SCHEDULED",
      officialUrl: "https://iridehardenduro.com/demo-sea-to-sky-2026",
    },
    {
      externalId: "hewc-2026-demo-valleys",
      name: "Demo Valleys Hard Enduro",
      seasonYear: 2026,
      startDate: "2026-05-10T08:00:00.000Z",
      endDate: "2026-05-12T18:00:00.000Z",
      countryName: "United Kingdom",
      countryCode: "GB",
      city: "Merthyr Tydfil",
      venue: "Welsh valleys",
      status: "COMPLETED",
      officialUrl: "https://iridehardenduro.com/demo-valleys-2026",
    },
  ];
}

export async function fetchOfficialEventsDemoResult(
  sourceUrl: string,
): Promise<OfficialEventsFetchResult> {
  const events = await fetchOfficialEventsDemo();

  return {
    mode: "demo",
    connectorStatus: "demo-fallback",
    sourceStatus: "not-configured",
    sourceUrl,
    fetchedAt: new Date(),
    rawContent: JSON.stringify({ events }, null, 2),
    events,
  };
}
