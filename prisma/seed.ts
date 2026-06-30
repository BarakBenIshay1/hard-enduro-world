import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_NOTE =
  "Demo seed data for preview only. Inspired by real Hard Enduro names and places; not official championship data.";

type RiderSeed = {
  firstName: string;
  lastName: string;
  slug: string;
  countrySlug: string;
  teamSlug: string;
  manufacturerSlug: string;
  motorcycleSlug: string;
  birthDate: string;
};

type EventSeed = {
  name: string;
  slug: string;
  year: number;
  roundNumber: number;
  countrySlug: string;
  city: string;
  venue: string;
  startDate: string;
  endDate: string;
  status: "COMPLETED" | "LIVE" | "SCHEDULED";
  liveStatus: "FINISHED" | "LIVE" | "UPCOMING";
  terrain: string;
  elevation: string;
  previousWinner: string;
  officialUrl: string;
  completed: boolean;
  winnerSlug?: string;
};

type ResultSeed = {
  rider: RiderSeed;
  position: number | null;
  status: "FINISHED" | "DNF" | "DNS" | "DSQ";
  points: number;
  totalTimeMs: number | null;
  penaltiesMs: number;
};

const countries = [
  ["austria", "Austria", "AT", "Europe"],
  ["germany", "Germany", "DE", "Europe"],
  ["united-kingdom", "United Kingdom", "GB", "Europe"],
  ["spain", "Spain", "ES", "Europe"],
  ["south-africa", "South Africa", "ZA", "Africa"],
  ["bulgaria", "Bulgaria", "BG", "Europe"],
  ["canada", "Canada", "CA", "North America"],
  ["poland", "Poland", "PL", "Europe"],
  ["turkey", "Turkey", "TR", "Europe/Asia"],
  ["italy", "Italy", "IT", "Europe"],
  ["israel", "Israel", "IL", "Asia"],
  ["united-states", "United States", "US", "North America"],
  ["japan", "Japan", "JP", "Asia"],
] as const;

const seasons = [
  { year: 2024, name: "2024 FIM Hard Enduro World Championship", status: "COMPLETED" },
  { year: 2025, name: "2025 FIM Hard Enduro World Championship", status: "COMPLETED" },
  { year: 2026, name: "2026 FIM Hard Enduro World Championship", status: "ACTIVE" },
] as const;

const manufacturers = [
  { name: "KTM", slug: "ktm", countrySlug: "austria" },
  { name: "Husqvarna", slug: "husqvarna", countrySlug: "austria" },
  { name: "GASGAS", slug: "gasgas", countrySlug: "spain" },
  { name: "Sherco", slug: "sherco", countrySlug: "spain" },
  { name: "Beta", slug: "beta", countrySlug: "italy" },
  { name: "Rieju", slug: "rieju", countrySlug: "spain" },
  { name: "TM Racing", slug: "tm-racing", countrySlug: "italy" },
  { name: "Honda", slug: "honda", countrySlug: "japan" },
  { name: "Fantic", slug: "fantic", countrySlug: "italy" },
] as const;

const motorcycles = [
  ["ktm-300-exc-2026", "ktm", "300 EXC", 300, "TWO_STROKE", 103.4, 54, 44, 9],
  ["ktm-300-xc-w-2026", "ktm", "300 XC-W", 300, "TWO_STROKE", 104.9, 54, 44, 9],
  ["husqvarna-te-300-2026", "husqvarna", "TE 300", 300, "TWO_STROKE", 106.4, 54, 44, 8.5],
  ["gasgas-ec-300-2026", "gasgas", "EC 300", 300, "TWO_STROKE", 106.2, 53, 43, 9],
  [
    "sherco-300-se-factory-2026",
    "sherco",
    "300 SE Factory",
    300,
    "TWO_STROKE",
    104,
    52,
    43,
    10.4,
  ],
  [
    "beta-rr-300-racing-2026",
    "beta",
    "RR 300 Racing",
    300,
    "TWO_STROKE",
    103.5,
    52,
    43,
    9.5,
  ],
  [
    "rieju-mr-300-racing-2026",
    "rieju",
    "MR 300 Racing",
    300,
    "TWO_STROKE",
    108,
    51,
    42,
    9.8,
  ],
  ["tm-racing-en-300-2026", "tm-racing", "EN 300", 300, "TWO_STROKE", 105, 53, 43, 8.7],
  ["honda-crf450rx-2026", "honda", "CRF450RX", 450, "FOUR_STROKE", 113, 56, 48, 8],
  ["fantic-xe-300-2026", "fantic", "XE 300", 300, "TWO_STROKE", 105, 52, 43, 9],
] as const;

const teams = [
  [
    "red-bull-ktm-factory-racing",
    "Red Bull KTM Factory Racing",
    "austria",
    "https://example.com/demo/red-bull-ktm",
  ],
  [
    "husqvarna-factory-racing",
    "Husqvarna Factory Racing",
    "austria",
    "https://example.com/demo/husqvarna",
  ],
  [
    "factory-sherco-racing",
    "Factory Sherco Racing",
    "spain",
    "https://example.com/demo/sherco",
  ],
  [
    "rieju-factory-racing",
    "Rieju Factory Racing",
    "spain",
    "https://example.com/demo/rieju",
  ],
  [
    "fmf-ktm-factory-racing",
    "FMF KTM Factory Racing",
    "united-states",
    "https://example.com/demo/fmf-ktm",
  ],
  [
    "beta-factory-racing",
    "Beta Factory Racing",
    "italy",
    "https://example.com/demo/beta",
  ],
  [
    "gasgas-factory-racing",
    "GASGAS Factory Racing",
    "spain",
    "https://example.com/demo/gasgas",
  ],
  ["tm-racing-enduro", "TM Racing Enduro", "italy", "https://example.com/demo/tm-racing"],
  [
    "privateer-hard-enduro",
    "Privateer Hard Enduro",
    "united-kingdom",
    "https://example.com/demo/privateer",
  ],
] as const;

const riders: RiderSeed[] = [
  {
    firstName: "Manuel",
    lastName: "Lettenbichler",
    slug: "manuel-lettenbichler",
    countrySlug: "germany",
    teamSlug: "red-bull-ktm-factory-racing",
    manufacturerSlug: "ktm",
    motorcycleSlug: "ktm-300-exc-2026",
    birthDate: "1998-03-10",
  },
  {
    firstName: "Billy",
    lastName: "Bolt",
    slug: "billy-bolt",
    countrySlug: "united-kingdom",
    teamSlug: "husqvarna-factory-racing",
    manufacturerSlug: "husqvarna",
    motorcycleSlug: "husqvarna-te-300-2026",
    birthDate: "1997-08-17",
  },
  {
    firstName: "Mario",
    lastName: "Roman",
    slug: "mario-roman",
    countrySlug: "spain",
    teamSlug: "factory-sherco-racing",
    manufacturerSlug: "sherco",
    motorcycleSlug: "sherco-300-se-factory-2026",
    birthDate: "1990-01-16",
  },
  {
    firstName: "Wade",
    lastName: "Young",
    slug: "wade-young",
    countrySlug: "south-africa",
    teamSlug: "rieju-factory-racing",
    manufacturerSlug: "rieju",
    motorcycleSlug: "rieju-mr-300-racing-2026",
    birthDate: "1996-04-05",
  },
  {
    firstName: "Teodor",
    lastName: "Kabakchiev",
    slug: "teodor-kabakchiev",
    countrySlug: "bulgaria",
    teamSlug: "sherco-privateer-racing",
    manufacturerSlug: "sherco",
    motorcycleSlug: "sherco-300-se-factory-2026",
    birthDate: "1998-02-21",
  },
  {
    firstName: "Trystan",
    lastName: "Hart",
    slug: "trystan-hart",
    countrySlug: "canada",
    teamSlug: "fmf-ktm-factory-racing",
    manufacturerSlug: "ktm",
    motorcycleSlug: "ktm-300-xc-w-2026",
    birthDate: "1997-08-03",
  },
  {
    firstName: "Jonny",
    lastName: "Walker",
    slug: "jonny-walker",
    countrySlug: "united-kingdom",
    teamSlug: "beta-factory-racing",
    manufacturerSlug: "beta",
    motorcycleSlug: "beta-rr-300-racing-2026",
    birthDate: "1991-01-27",
  },
  {
    firstName: "Graham",
    lastName: "Jarvis",
    slug: "graham-jarvis",
    countrySlug: "united-kingdom",
    teamSlug: "privateer-hard-enduro",
    manufacturerSlug: "husqvarna",
    motorcycleSlug: "husqvarna-te-300-2026",
    birthDate: "1975-04-21",
  },
  {
    firstName: "Michael",
    lastName: "Walkner",
    slug: "michael-walkner",
    countrySlug: "austria",
    teamSlug: "gasgas-factory-racing",
    manufacturerSlug: "gasgas",
    motorcycleSlug: "gasgas-ec-300-2026",
    birthDate: "1998-05-24",
  },
  {
    firstName: "Alfredo",
    lastName: "Gomez",
    slug: "alfredo-gomez",
    countrySlug: "spain",
    teamSlug: "rieju-factory-racing",
    manufacturerSlug: "rieju",
    motorcycleSlug: "rieju-mr-300-racing-2026",
    birthDate: "1989-08-06",
  },
  {
    firstName: "Dominik",
    lastName: "Olszowy",
    slug: "dominik-olszowy",
    countrySlug: "poland",
    teamSlug: "tm-racing-enduro",
    manufacturerSlug: "tm-racing",
    motorcycleSlug: "tm-racing-en-300-2026",
    birthDate: "1999-11-02",
  },
  {
    firstName: "Mitch",
    lastName: "Brightmore",
    slug: "mitch-brightmore",
    countrySlug: "united-kingdom",
    teamSlug: "gasgas-factory-racing",
    manufacturerSlug: "gasgas",
    motorcycleSlug: "gasgas-ec-300-2026",
    birthDate: "2001-07-18",
  },
];

const extraTeams = [
  [
    "sherco-privateer-racing",
    "Sherco Privateer Racing",
    "bulgaria",
    "https://example.com/demo/sherco-privateer",
  ],
] as const;

const eventTemplates = [
  [
    "minus-400",
    "Minus 400",
    "israel",
    "Arad",
    "Dead Sea desert",
    "Desert ridges, dry riverbeds, heat, navigation",
    "430 m below sea level",
  ],
  [
    "valleys-hard-enduro",
    "Valleys Hard Enduro",
    "united-kingdom",
    "South Wales",
    "Welsh valleys",
    "Steep woodland, slick climbs, roots, rock gardens",
    "550 m",
  ],
  [
    "erzbergrodeo",
    "Erzbergrodeo",
    "austria",
    "Eisenerz",
    "Iron Giant quarry",
    "Iron ore quarry, boulder fields, high-speed quarry climbs",
    "1,466 m",
  ],
  [
    "abestone-hard-enduro",
    "Abestone Hard Enduro",
    "italy",
    "Abetone",
    "Tuscan Apennines",
    "Mountain singletrack, ski slopes, forest climbs",
    "1,388 m",
  ],
  [
    "red-bull-romaniacs",
    "Red Bull Romaniacs",
    "romania",
    "Sibiu",
    "Carpathian Mountains",
    "Multi-day mountain navigation, riverbeds, alpine climbs",
    "2,200 m",
  ],
  [
    "sea-to-sky",
    "Sea to Sky",
    "turkey",
    "Kemer",
    "Mediterranean coast to Olympos",
    "Beach start, canyon trails, mountain summit finish",
    "2,365 m",
  ],
  [
    "hixpania-hard-enduro",
    "Hixpania Hard Enduro",
    "spain",
    "Aguilar de Campoo",
    "Campoo lake and medieval old town",
    "Lake shore sprints, forest climbs, rocky ravines",
    "1,050 m",
  ],
  [
    "getzenrodeo",
    "GetzenRodeo",
    "germany",
    "Griesbach",
    "Getzenwald forest",
    "Short-course forest intensity, technical climbs, spectator arena",
    "720 m",
  ],
  [
    "roof-of-africa",
    "Roof of Africa",
    "south-africa",
    "Maseru",
    "Maloti Mountains",
    "High-altitude passes, remote mountain trails, endurance navigation",
    "3,000 m",
  ],
  [
    "tennessee-knockout",
    "Tennessee Knockout",
    "united-states",
    "Sequatchie",
    "Trials Training Center",
    "Knockout racing, creek beds, Tennessee rock ledges",
    "420 m",
  ],
] as const;

const winnerCycle = [
  "manuel-lettenbichler",
  "billy-bolt",
  "mario-roman",
  "trystan-hart",
  "manuel-lettenbichler",
  "wade-young",
  "billy-bolt",
  "mario-roman",
  "manuel-lettenbichler",
  "trystan-hart",
];

const eventSeeds: EventSeed[] = [
  ...buildSeasonEvents(2026, "2026", [
    "minus-400",
    "valleys-hard-enduro",
    "erzbergrodeo",
    "abestone-hard-enduro",
    "red-bull-romaniacs",
    "sea-to-sky",
    "hixpania-hard-enduro",
    "getzenrodeo",
    "roof-of-africa",
    "tennessee-knockout",
  ]),
  ...buildSeasonEvents(2025, "2025", [
    "erzbergrodeo",
    "red-bull-romaniacs",
    "abestone-hard-enduro",
    "sea-to-sky",
    "hixpania-hard-enduro",
    "getzenrodeo",
    "roof-of-africa",
    "tennessee-knockout",
  ]),
  ...buildSeasonEvents(2024, "2024", [
    "erzbergrodeo",
    "red-bull-romaniacs",
    "hixpania-hard-enduro",
    "sea-to-sky",
    "getzenrodeo",
    "roof-of-africa",
  ]),
];

const pointsByPosition = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4];

async function main() {
  await prisma.$transaction([
    prisma.dataVersion.deleteMany(),
    prisma.importRun.deleteMany(),
    prisma.sourceLink.deleteMany(),
    prisma.sourceSnapshot.deleteMany(),
    prisma.dataSource.deleteMany(),
    prisma.mediaEntityLink.deleteMany(),
    prisma.mediaItem.deleteMany(),
    prisma.newsArticle.deleteMany(),
    prisma.weatherSnapshot.deleteMany(),
    prisma.hallOfFameEntry.deleteMany(),
    prisma.championshipRecord.deleteMany(),
    prisma.standing.deleteMany(),
    prisma.result.deleteMany(),
    prisma.stageResult.deleteMany(),
    prisma.riderComparisonSnapshot.deleteMany(),
    prisma.manufacturerSeasonStat.deleteMany(),
    prisma.motorcycleSeasonStat.deleteMany(),
    prisma.riderCareerSeason.deleteMany(),
    prisma.teamMembership.deleteMany(),
    prisma.raceStage.deleteMany(),
    prisma.eventTimelineItem.deleteMany(),
    prisma.event.deleteMany(),
    prisma.rider.deleteMany(),
    prisma.motorcycle.deleteMany(),
    prisma.manufacturer.deleteMany(),
    prisma.team.deleteMany(),
    prisma.country.deleteMany(),
    prisma.season.deleteMany(),
  ]);

  const countryMap = new Map<string, { id: string; name: string; slug: string }>();
  const seasonMap = new Map<number, { id: string; year: number }>();
  const manufacturerMap = new Map<string, { id: string; name: string; slug: string }>();
  const motorcycleMap = new Map<string, { id: string; slug: string }>();
  const teamMap = new Map<string, { id: string; name: string; slug: string }>();
  const riderMap = new Map<
    string,
    { id: string; slug: string; firstName: string; lastName: string }
  >();
  const eventMap = new Map<string, { id: string; slug: string; name: string }>();

  for (const [slug, name, isoCode, continent] of [
    ...countries,
    ["romania", "Romania", "RO", "Europe"] as const,
  ]) {
    const country = await prisma.country.create({
      data: {
        name,
        isoCode,
        slug,
        continent,
        flagImageUrl: `https://example.com/demo/flags/${isoCode.toLowerCase()}.svg`,
      },
    });
    countryMap.set(slug, country);
  }

  for (const seed of seasons) {
    const season = await prisma.season.create({
      data: seed,
    });
    seasonMap.set(seed.year, season);
  }

  for (const seed of manufacturers) {
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: seed.name,
        slug: seed.slug,
        countryId: countryMap.get(seed.countrySlug)?.id,
      },
    });
    manufacturerMap.set(seed.slug, manufacturer);
    prismaManufacturerMap.set(seed.slug, manufacturer);
  }

  for (const [
    slug,
    manufacturerSlug,
    model,
    engineCc,
    strokeType,
    weightKg,
    horsepower,
    torqueNm,
    fuelCapacityL,
  ] of motorcycles) {
    const motorcycle = await prisma.motorcycle.create({
      data: {
        manufacturerId: manufacturerMap.get(manufacturerSlug)!.id,
        model,
        slug,
        year: 2026,
        engineCc,
        strokeType,
        weightKg,
        suspensionFront:
          strokeType === "FOUR_STROKE"
            ? "Showa 49 mm factory fork"
            : "Factory 48 mm enduro fork",
        suspensionRear:
          strokeType === "FOUR_STROKE" ? "Showa factory shock" : "Factory enduro shock",
        horsepower,
        torqueNm,
        fuelCapacityL,
        description: `${DEMO_NOTE} Technical preview for ${model}.`,
      },
    });
    motorcycleMap.set(slug, motorcycle);
    prismaMotorcycleMap.set(slug, motorcycle);
  }

  for (const [slug, name, countrySlug, officialUrl] of [...teams, ...extraTeams]) {
    const team = await prisma.team.create({
      data: {
        name,
        slug,
        countryId: countryMap.get(countrySlug)?.id,
        officialUrl,
      },
    });
    teamMap.set(slug, team);
  }

  for (const seed of riders) {
    const rider = await prisma.rider.create({
      data: {
        firstName: seed.firstName,
        lastName: seed.lastName,
        slug: seed.slug,
        countryId: countryMap.get(seed.countrySlug)?.id,
        currentMotorcycleId: motorcycleMap.get(seed.motorcycleSlug)?.id,
        birthDate: new Date(`${seed.birthDate}T00:00:00.000Z`),
        officialUrl: `https://example.com/demo/riders/${seed.slug}`,
      },
    });
    riderMap.set(seed.slug, rider);
    prismaRiderMap.set(seed.slug, rider);
  }

  for (const seed of eventSeeds) {
    const season = seasonMap.get(seed.year)!;
    const event = await prisma.event.create({
      data: {
        seasonId: season.id,
        countryId: countryMap.get(seed.countrySlug)?.id,
        name: seed.name,
        slug: seed.slug,
        roundNumber: seed.roundNumber,
        city: seed.city,
        venue: seed.venue,
        startDate: new Date(`${seed.startDate}T08:00:00.000Z`),
        endDate: new Date(`${seed.endDate}T18:00:00.000Z`),
        status: seed.status,
        liveStatus: seed.liveStatus,
        officialUrl: seed.officialUrl,
        description: `${DEMO_NOTE} Terrain: ${seed.terrain}. Elevation: ${seed.elevation}. Previous winner marker: ${seed.previousWinner}.`,
      },
    });
    eventMap.set(seed.slug, event);

    await seedEventTimeline(event.id, seed);
    await seedWeather(event.id, seed.roundNumber);
    await seedEventMedia(event.id, seed);

    if (seed.completed) {
      await seedStagesAndResults(event, seed);
    }
  }

  await seedMembershipsAndCareers();
  await seedSeasonStandingsAndStats();
  await seedRecordsAndHallOfFame();
  await seedSourcesAndAudit(eventMap);

  console.log(
    `Seed complete: ${eventSeeds.length} demo events, ${riders.length} demo riders, review-only connector data.`,
  );
}

function buildSeasonEvents(year: number, suffix: string, templateSlugs: string[]) {
  const startDates: Record<string, [string, string]> = {
    "minus-400": [`${year}-02-05`, `${year}-02-07`],
    "valleys-hard-enduro": [`${year}-05-09`, `${year}-05-10`],
    erzbergrodeo: [`${year}-06-04`, `${year}-06-07`],
    "abestone-hard-enduro": [`${year}-06-20`, `${year}-06-21`],
    "red-bull-romaniacs": [`${year}-07-21`, `${year}-07-25`],
    "sea-to-sky": [`${year}-10-08`, `${year}-10-10`],
    "hixpania-hard-enduro": [`${year}-10-16`, `${year}-10-18`],
    getzenrodeo: [`${year}-11-01`, `${year}-11-01`],
    "roof-of-africa": [`${year}-11-20`, `${year}-11-22`],
    "tennessee-knockout": [`${year}-08-14`, `${year}-08-16`],
  };

  return templateSlugs.map((templateSlug, index): EventSeed => {
    const template = eventTemplates.find(([slug]) => slug === templateSlug)!;
    const [baseSlug, name, countrySlug, city, venue, terrain, elevation] = template;
    const completed = year < 2026 || index < 4;
    const isLiveDemo = year === 2026 && index === 4;
    const [startDate, endDate] = startDates[baseSlug];

    return {
      name: `${name} ${suffix}`,
      slug: `${baseSlug}-${year}`,
      year,
      roundNumber: index + 1,
      countrySlug,
      city,
      venue,
      startDate,
      endDate,
      status: completed ? "COMPLETED" : isLiveDemo ? "LIVE" : "SCHEDULED",
      liveStatus: completed ? "FINISHED" : isLiveDemo ? "LIVE" : "UPCOMING",
      terrain,
      elevation,
      previousWinner: riderNameBySlug(winnerCycle[(index + year) % winnerCycle.length]),
      officialUrl: `https://example.com/demo/events/${baseSlug}-${year}`,
      completed,
      winnerSlug: winnerCycle[(index + year) % winnerCycle.length],
    };
  });
}

async function seedEventTimeline(eventId: string, seed: EventSeed) {
  const start = new Date(`${seed.startDate}T08:00:00.000Z`);
  const dayBefore = new Date(start);
  dayBefore.setDate(dayBefore.getDate() - 1);

  await prisma.eventTimelineItem.createMany({
    data: [
      {
        eventId,
        type: "REGISTRATION_OPEN",
        title: "Demo registration opens",
        description: DEMO_NOTE,
        occurredAt: new Date(`${seed.year}-01-10T09:00:00.000Z`),
      },
      {
        eventId,
        type: "ENTRY_LIST_PUBLISHED",
        title: "Demo entry list published",
        description: "Preview entry list for seeded riders.",
        occurredAt: dayBefore,
      },
      {
        eventId,
        type: seed.completed ? "FINAL_CLASSIFICATION" : "OFFICIAL_DOCUMENT",
        title: seed.completed
          ? "Demo final classification available"
          : "Official document placeholder",
        description: seed.completed
          ? "Seeded final classification for preview pages."
          : "Future source-tracked official document placeholder.",
        occurredAt: seed.completed ? new Date(`${seed.endDate}T18:30:00.000Z`) : start,
        url: seed.officialUrl,
      },
    ],
  });
}

async function seedWeather(eventId: string, roundNumber: number) {
  await prisma.weatherSnapshot.create({
    data: {
      eventId,
      temperatureC: 14 + roundNumber * 1.8,
      humidityPercent: 48 + roundNumber * 3,
      rainMm: roundNumber % 3 === 0 ? 6.5 : 0,
      windSpeedKmh: 7 + roundNumber,
      weatherDescription:
        roundNumber % 3 === 0 ? "Demo mixed mountain weather" : "Demo dry race window",
      provider: "manual-demo-seed",
      rawPayload: {
        demo: true,
        note: DEMO_NOTE,
      },
    },
  });
}

async function seedEventMedia(eventId: string, seed: EventSeed) {
  const image = await prisma.mediaItem.create({
    data: {
      eventId,
      type: "IMAGE",
      title: `${seed.name} demo hero image`,
      description: DEMO_NOTE,
      url: `https://example.com/demo/media/${seed.slug}.jpg`,
      thumbnailUrl: `https://example.com/demo/media/${seed.slug}-thumb.jpg`,
      source: "manual demo seed",
      provider: "manual",
      tags: ["demo", "event", seed.countrySlug],
      dateTaken: new Date(`${seed.startDate}T12:00:00.000Z`),
    },
  });

  await prisma.mediaEntityLink.create({
    data: {
      mediaItemId: image.id,
      entityType: "EVENT",
      entityId: eventId,
    },
  });
}

async function seedStagesAndResults(
  event: { id: string; slug: string; name: string },
  seed: EventSeed,
) {
  const stageSeeds = [
    ["prologue", "Prologue", "PROLOGUE", 1, 6.2],
    ["day-1", "Day 1", "DAY", 2, 58],
    ["day-2", "Day 2", "DAY", 3, 64],
    ["final", "Final", "FINAL", 4, 42],
  ] as const;
  const overallResults = buildEventResults(seed);

  for (const [slug, name, stageType, stageOrder, distanceKm] of stageSeeds) {
    const stage = await prisma.raceStage.create({
      data: {
        eventId: event.id,
        name,
        slug,
        stageType,
        stageOrder,
        status: "FINISHED",
        startDate: new Date(
          `${seed.startDate}T0${Math.min(stageOrder + 7, 9)}:00:00.000Z`,
        ),
        endDate: new Date(`${seed.startDate}T1${Math.min(stageOrder, 9)}:30:00.000Z`),
        distanceKm,
        officialUrl: `${seed.officialUrl}#${slug}`,
        notes: DEMO_NOTE,
      },
    });

    const stageOrderResults = rotateResults(overallResults, stageOrder - 1);
    let previousTime: number | null = null;
    const leaderTime = stageOrderResults.find(
      (row) => row.status === "FINISHED",
    )?.totalTimeMs;

    for (let index = 0; index < stageOrderResults.length; index += 1) {
      const row = stageOrderResults[index];
      const stageTime =
        row.status === "FINISHED" && row.totalTimeMs
          ? Math.round(row.totalTimeMs / 4 + stageOrder * 45000 + index * 9000)
          : null;
      const position = row.status === "FINISHED" ? index + 1 : null;

      await prisma.stageResult.create({
        data: {
          stageId: stage.id,
          riderId: row.riderRecord.id,
          motorcycleId: row.motorcycleId,
          manufacturerId: row.manufacturerId,
          className: "Pro",
          overallPosition: position,
          classPosition: position,
          totalTimeMs: stageTime,
          totalTimeText: stageTime ? formatDuration(stageTime) : row.status,
          gapToLeaderMs:
            stageTime && leaderTime ? Math.max(stageTime - leaderTime / 4, 0) : null,
          gapToLeaderText:
            stageTime && leaderTime
              ? formatGap(Math.max(stageTime - leaderTime / 4, 0))
              : null,
          gapToPreviousMs:
            stageTime && previousTime ? Math.max(stageTime - previousTime, 0) : null,
          gapToPreviousText:
            stageTime && previousTime
              ? formatGap(Math.max(stageTime - previousTime, 0))
              : null,
          checkpointsCompleted: row.status === "DNS" ? 0 : row.status === "DNF" ? 7 : 12,
          penaltiesMs: row.penaltiesMs,
          penaltiesText: row.penaltiesMs ? formatGap(row.penaltiesMs) : null,
          averageSpeedKmh: stageTime
            ? Math.round(Number(distanceKm) / (stageTime / 3600000))
            : null,
          status: row.status,
          notes: DEMO_NOTE,
          officialRawRow: {
            demo: true,
            event: seed.name,
            stage: name,
            rider: riderName(row.rider),
          },
        },
      });

      if (stageTime) {
        previousTime = stageTime;
      }
    }
  }

  for (let index = 0; index < overallResults.length; index += 1) {
    const row = overallResults[index];

    await prisma.result.create({
      data: {
        eventId: event.id,
        riderId: row.riderRecord.id,
        motorcycleId: row.motorcycleId,
        manufacturerId: row.manufacturerId,
        className: "Pro",
        overallPosition: row.position,
        classPosition: row.position,
        points: row.points,
        totalTimeMs: row.totalTimeMs,
        totalTimeText: row.totalTimeMs ? formatDuration(row.totalTimeMs) : row.status,
        gapToLeaderMs: row.gapToLeaderMs,
        gapToLeaderText: row.gapToLeaderMs ? formatGap(row.gapToLeaderMs) : null,
        gapToPreviousMs: row.gapToPreviousMs,
        gapToPreviousText: row.gapToPreviousMs ? formatGap(row.gapToPreviousMs) : null,
        penaltiesMs: row.penaltiesMs,
        checkpointsCompleted: row.status === "DNS" ? 0 : row.status === "DNF" ? 9 : 18,
        averageSpeedKmh: row.status === "FINISHED" ? 18 + index : null,
        status: row.status,
        notes: DEMO_NOTE,
        officialRawRow: {
          demo: true,
          source: "manual-seed",
          event: seed.name,
          rider: riderName(row.rider),
        },
      },
    });
  }
}

function buildEventResults(seed: EventSeed) {
  const winnerIndex = riders.findIndex((rider) => rider.slug === seed.winnerSlug);
  const ordered = rotateArray(riders, winnerIndex >= 0 ? winnerIndex : seed.roundNumber);
  const dnfSlug = ordered[(seed.roundNumber + 5) % ordered.length].slug;
  const dnsSlug =
    seed.roundNumber % 4 === 0
      ? ordered[(seed.roundNumber + 8) % ordered.length].slug
      : null;
  let finishPosition = 1;
  let previousTime: number | null = null;
  const leaderTime = 12_600_000 + seed.roundNumber * 420_000;

  return ordered.map((rider, index) => {
    const status =
      rider.slug === dnsSlug ? "DNS" : rider.slug === dnfSlug ? "DNF" : "FINISHED";
    const position = status === "FINISHED" ? finishPosition++ : null;
    const penaltiesMs = index % 5 === 0 && status === "FINISHED" ? 120_000 : 0;
    const totalTimeMs =
      status === "FINISHED" && position
        ? leaderTime +
          (position - 1) * (440_000 + seed.roundNumber * 12_000) +
          penaltiesMs
        : null;
    const gapToLeaderMs = totalTimeMs ? totalTimeMs - leaderTime : null;
    const gapToPreviousMs =
      totalTimeMs && previousTime ? Math.max(totalTimeMs - previousTime, 0) : null;
    const points = position
      ? (pointsByPosition[position - 1] ?? Math.max(12 - position, 0))
      : 0;
    const riderRecord = prismaRiderMap.get(rider.slug)!;
    const motorcycleId = prismaMotorcycleMap.get(rider.motorcycleSlug)!.id;
    const manufacturerId = prismaManufacturerMap.get(rider.manufacturerSlug)!.id;

    if (totalTimeMs) {
      previousTime = totalTimeMs;
    }

    return {
      rider,
      riderRecord,
      motorcycleId,
      manufacturerId,
      position,
      status,
      points,
      totalTimeMs,
      gapToLeaderMs,
      gapToPreviousMs,
      penaltiesMs,
    } satisfies ResultSeed & {
      riderRecord: { id: string };
      motorcycleId: string;
      manufacturerId: string;
      gapToLeaderMs: number | null;
      gapToPreviousMs: number | null;
    };
  });
}

const prismaRiderMap = new Map<string, { id: string }>();
const prismaMotorcycleMap = new Map<string, { id: string }>();
const prismaManufacturerMap = new Map<string, { id: string }>();

async function seedMembershipsAndCareers() {
  const seasonsInDb = await prisma.season.findMany();
  const resultRows = await prisma.result.findMany({
    include: {
      event: true,
      rider: true,
    },
  });

  for (const rider of riders) {
    const riderRecord = prismaRiderMap.get(rider.slug)!;
    const team = await prisma.team.findUnique({ where: { slug: rider.teamSlug } });
    const manufacturer = prismaManufacturerMap.get(rider.manufacturerSlug)!;
    const motorcycle = prismaMotorcycleMap.get(rider.motorcycleSlug)!;

    for (const season of seasonsInDb) {
      await prisma.teamMembership.create({
        data: {
          riderId: riderRecord.id,
          teamId: team!.id,
          seasonId: season.id,
          startDate: new Date(`${season.year}-01-01T00:00:00.000Z`),
        },
      });

      const seasonResults = resultRows.filter(
        (result) =>
          result.riderId === riderRecord.id && result.event.seasonId === season.id,
      );
      const starts = seasonResults.length;
      const wins = seasonResults.filter((result) => result.overallPosition === 1).length;
      const podiums = seasonResults.filter(
        (result) => result.overallPosition && result.overallPosition <= 3,
      ).length;
      const dnfs = seasonResults.filter((result) => result.status === "DNF").length;
      const points = seasonResults.reduce(
        (total, result) => total + (result.points ?? 0),
        0,
      );

      await prisma.riderCareerSeason.create({
        data: {
          riderId: riderRecord.id,
          seasonId: season.id,
          teamId: team?.id,
          manufacturerId: manufacturer.id,
          motorcycleId: motorcycle.id,
          className: "Pro",
          championshipPosition: null,
          points,
          wins,
          podiums,
          starts,
          dnfs,
          stageWins: Math.max(wins * 2, podiums),
          averageFinishPosition: averageFinish(seasonResults),
          statistics: {
            demo: true,
            note: DEMO_NOTE,
          },
        },
      });
    }
  }
}

async function seedSeasonStandingsAndStats() {
  const seasonsInDb = await prisma.season.findMany();

  for (const season of seasonsInDb) {
    const careers = await prisma.riderCareerSeason.findMany({
      where: { seasonId: season.id },
      orderBy: [{ points: "desc" }, { wins: "desc" }, { podiums: "desc" }],
    });

    for (let index = 0; index < careers.length; index += 1) {
      const career = careers[index];
      await prisma.standing.create({
        data: {
          seasonId: season.id,
          riderId: career.riderId,
          className: "Pro",
          position: index + 1,
          points: career.points,
          wins: career.wins,
          podiums: career.podiums,
          starts: career.starts,
          dnfs: career.dnfs,
        },
      });

      await prisma.riderCareerSeason.update({
        where: { id: career.id },
        data: {
          championshipPosition: index + 1,
        },
      });
    }

    const results = await prisma.result.findMany({
      where: { event: { seasonId: season.id } },
      include: {
        motorcycle: true,
        manufacturer: true,
      },
    });
    const manufacturerIds = [
      ...new Set(
        results.flatMap((row) => (row.manufacturerId ? [row.manufacturerId] : [])),
      ),
    ];
    const motorcycleIds = [
      ...new Set(results.flatMap((row) => (row.motorcycleId ? [row.motorcycleId] : []))),
    ];

    for (const manufacturerId of manufacturerIds) {
      const rows = results.filter((row) => row.manufacturerId === manufacturerId);
      await prisma.manufacturerSeasonStat.create({
        data: {
          manufacturerId,
          seasonId: season.id,
          className: "Pro",
          championshipsWon: careers[0]?.manufacturerId === manufacturerId ? 1 : 0,
          wins: rows.filter((row) => row.overallPosition === 1).length,
          podiums: rows.filter((row) => row.overallPosition && row.overallPosition <= 3)
            .length,
          starts: rows.length,
          dnfs: rows.filter((row) => row.status === "DNF").length,
          winPercentage: rows.length
            ? (rows.filter((row) => row.overallPosition === 1).length / rows.length) * 100
            : 0,
          statistics: { demo: true, note: DEMO_NOTE },
        },
      });
    }

    for (const motorcycleId of motorcycleIds) {
      const rows = results.filter((row) => row.motorcycleId === motorcycleId);
      await prisma.motorcycleSeasonStat.create({
        data: {
          motorcycleId,
          seasonId: season.id,
          className: "Pro",
          eventsEntered: new Set(rows.map((row) => row.eventId)).size,
          ridersCount: new Set(rows.map((row) => row.riderId)).size,
          wins: rows.filter((row) => row.overallPosition === 1).length,
          podiums: rows.filter((row) => row.overallPosition && row.overallPosition <= 3)
            .length,
          dnfs: rows.filter((row) => row.status === "DNF").length,
          championshipsWon: careers[0]?.motorcycleId === motorcycleId ? 1 : 0,
          winPercentage: rows.length
            ? (rows.filter((row) => row.overallPosition === 1).length / rows.length) * 100
            : 0,
          statistics: { demo: true, note: DEMO_NOTE },
        },
      });
    }
  }
}

async function seedRecordsAndHallOfFame() {
  const topStanding = await prisma.standing.findFirst({
    orderBy: [{ wins: "desc" }, { points: "desc" }],
    include: { rider: true },
  });
  const mostDnfs = await prisma.standing.findFirst({
    orderBy: [{ dnfs: "desc" }, { starts: "desc" }],
    include: { rider: true },
  });
  const ktm = await prisma.manufacturer.findUnique({ where: { slug: "ktm" } });
  const ktmBike = await prisma.motorcycle.findUnique({
    where: { slug: "ktm-300-exc-2026" },
  });

  await prisma.championshipRecord.createMany({
    data: [
      {
        type: "MOST_WINS",
        title: "Most demo wins",
        description: DEMO_NOTE,
        entityType: "RIDER",
        entityId: topStanding?.riderId,
        valueNumber: topStanding?.wins ?? 0,
        valueText: topStanding
          ? `${topStanding.rider.firstName} ${topStanding.rider.lastName}`
          : "Pending",
        metadata: { demo: true },
      },
      {
        type: "MOST_DNFS",
        title: "Most demo DNFs",
        description: DEMO_NOTE,
        entityType: "RIDER",
        entityId: mostDnfs?.riderId,
        valueNumber: mostDnfs?.dnfs ?? 0,
        valueText: mostDnfs
          ? `${mostDnfs.rider.firstName} ${mostDnfs.rider.lastName}`
          : "Pending",
        metadata: { demo: true },
      },
      {
        type: "CUSTOM",
        title: "Most successful demo manufacturer",
        description: DEMO_NOTE,
        entityType: "MANUFACTURER",
        entityId: ktm?.id,
        valueNumber: 4,
        valueText: "KTM",
        metadata: { demo: true },
      },
      {
        type: "CUSTOM",
        title: "Most successful demo motorcycle",
        description: DEMO_NOTE,
        entityType: "MOTORCYCLE",
        entityId: ktmBike?.id,
        valueNumber: 4,
        valueText: "KTM 300 EXC 2026",
        metadata: { demo: true },
      },
    ],
  });

  await prisma.hallOfFameEntry.createMany({
    data: [
      {
        type: "WORLD_CHAMPION",
        title: "Demo world champion archive",
        slug: "demo-world-champion-archive",
        entityType: "RIDER",
        entityId: topStanding?.riderId,
        rank: 1,
        summary: DEMO_NOTE,
        metadata: { demo: true },
      },
      {
        type: "LEGENDARY_EVENT",
        title: "Erzbergrodeo demo archive",
        slug: "erzbergrodeo-demo-archive",
        entityType: "EVENT",
        summary: DEMO_NOTE,
        metadata: { demo: true },
      },
      {
        type: "ICONIC_MOTORCYCLE",
        title: "KTM 300 EXC demo archive",
        slug: "ktm-300-exc-demo-archive",
        entityType: "MOTORCYCLE",
        entityId: ktmBike?.id,
        summary: DEMO_NOTE,
        metadata: { demo: true },
      },
    ],
  });
}

async function seedSourcesAndAudit(
  eventMap: Map<string, { id: string; slug: string; name: string }>,
) {
  const sources = await Promise.all([
    prisma.dataSource.create({
      data: {
        name: "Manual admin source",
        type: "MANUAL",
        reliability: "OFFICIAL",
        baseUrl: "https://example.com/demo/admin",
      },
    }),
    prisma.dataSource.create({
      data: {
        name: "FIM official source",
        type: "OFFICIAL_WEBSITE",
        reliability: "OFFICIAL",
        baseUrl: "https://www.fim-moto.com",
      },
    }),
    prisma.dataSource.create({
      data: {
        name: "Official timing system source",
        type: "TIMING_SYSTEM",
        reliability: "OFFICIAL",
        baseUrl: "https://example.com/demo/timing",
      },
    }),
    prisma.dataSource.create({
      data: {
        name: "Hard Enduro World Championship official source",
        type: "OFFICIAL_WEBSITE",
        reliability: "OFFICIAL",
        baseUrl: "https://example.com/demo/championship",
      },
    }),
    prisma.dataSource.create({
      data: {
        name: "YouTube official channel source",
        type: "YOUTUBE",
        reliability: "TRUSTED",
        baseUrl: "https://www.youtube.com",
      },
    }),
    prisma.dataSource.create({
      data: {
        name: "Weather provider source",
        type: "WEATHER",
        reliability: "TRUSTED",
        baseUrl: "https://open-meteo.com",
      },
    }),
  ]);
  const [
    manualSource,
    fimSource,
    timingSource,
    championshipSource,
    youtubeSource,
    weatherSource,
  ] = sources;
  const sampleEvent =
    eventMap.get("erzbergrodeo-2026") ?? Array.from(eventMap.values())[0];

  for (const event of eventMap.values()) {
    await prisma.sourceLink.create({
      data: {
        dataSourceId: championshipSource.id,
        url: `https://example.com/demo/events/${event.slug}`,
        entityType: "EVENT",
        entityId: event.id,
        note: DEMO_NOTE,
      },
    });
  }

  const [
    fimSnapshot,
    timingSnapshot,
    championshipSnapshot,
    youtubeSnapshot,
    weatherSnapshot,
  ] = await Promise.all([
    prisma.sourceSnapshot.create({
      data: {
        dataSourceId: fimSource.id,
        url: "https://www.fim-moto.com/demo-hard-enduro-results",
        contentHash: "demo-fim-results-expanded-001",
        rawContent: "Expanded demo FIM-style payload. No external website was fetched.",
        fetchedAt: new Date("2026-06-04T08:00:00.000Z"),
        statusCode: 200,
      },
    }),
    prisma.sourceSnapshot.create({
      data: {
        dataSourceId: timingSource.id,
        url: "https://example.com/demo/timing/results",
        contentHash: "demo-timing-expanded-001",
        rawContent: "Expanded demo official timing payload. Review-only.",
        fetchedAt: new Date("2026-06-04T08:40:00.000Z"),
        statusCode: 200,
      },
    }),
    prisma.sourceSnapshot.create({
      data: {
        dataSourceId: championshipSource.id,
        url: "https://example.com/demo/championship/calendar",
        contentHash: "demo-calendar-expanded-001",
        rawContent: "Expanded demo event calendar payload. Review-only.",
        fetchedAt: new Date("2026-06-04T08:10:00.000Z"),
        statusCode: 200,
      },
    }),
    prisma.sourceSnapshot.create({
      data: {
        dataSourceId: youtubeSource.id,
        url: "https://www.youtube.com/@HardEnduroWorld/demo",
        contentHash: "demo-youtube-expanded-001",
        rawContent: "Expanded demo YouTube payload. No external API call was made.",
        fetchedAt: new Date("2026-06-04T08:30:00.000Z"),
        statusCode: 200,
      },
    }),
    prisma.sourceSnapshot.create({
      data: {
        dataSourceId: weatherSource.id,
        url: "https://open-meteo.com/demo-hard-enduro-weather",
        contentHash: "demo-weather-expanded-001",
        rawContent: "Expanded demo weather payload. No external API call was made.",
        fetchedAt: new Date("2026-06-04T08:20:00.000Z"),
        statusCode: 200,
      },
    }),
  ]);

  const completedImportRun = await prisma.importRun.create({
    data: {
      sourceSnapshotId: fimSnapshot.id,
      jobName: "demo-expanded-results-import",
      status: "COMPLETED",
      startedAt: new Date("2026-06-04T08:01:00.000Z"),
      finishedAt: new Date("2026-06-04T08:02:00.000Z"),
      recordsFound: 96,
      recordsCreated: 0,
      recordsUpdated: 12,
      recordsSkipped: 84,
      metadata: { demo: true, note: DEMO_NOTE },
    },
  });

  await prisma.importRun.createMany({
    data: [
      {
        sourceSnapshotId: championshipSnapshot.id,
        jobName: "official-events-demo-calendar-import",
        status: "NEEDS_REVIEW",
        startedAt: new Date("2026-06-04T08:13:00.000Z"),
        recordsFound: 10,
        recordsCreated: 2,
        recordsUpdated: 8,
        recordsSkipped: 0,
        metadata: {
          demo: true,
          jobId: "official-events",
          autoPublish: false,
          reviewRequired: true,
        },
      },
      {
        sourceSnapshotId: timingSnapshot.id,
        jobName: "official-results-demo-classification-import",
        status: "NEEDS_REVIEW",
        startedAt: new Date("2026-06-04T08:41:00.000Z"),
        recordsFound: 48,
        recordsCreated: 4,
        recordsUpdated: 9,
        recordsSkipped: 35,
        metadata: {
          demo: true,
          jobId: "official-results",
          riskLevel: "high",
          reviewRequired: true,
          autoPublish: false,
        },
      },
      {
        sourceSnapshotId: youtubeSnapshot.id,
        jobName: "youtube-videos-demo-import",
        status: "NEEDS_REVIEW",
        startedAt: new Date("2026-06-04T08:31:00.000Z"),
        recordsFound: 6,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        metadata: { demo: true, jobId: "youtube-videos", autoPublish: false },
      },
      {
        sourceSnapshotId: weatherSnapshot.id,
        jobName: "demo-weather-import",
        status: "FAILED",
        startedAt: new Date("2026-06-04T08:21:00.000Z"),
        finishedAt: new Date("2026-06-04T08:22:00.000Z"),
        recordsFound: 1,
        recordsSkipped: 1,
        errorMessage: "Demo failure for failed-import dashboard state.",
      },
    ],
  });

  await prisma.dataVersion.createMany({
    data: [
      {
        entityType: "RESULT",
        entityId: sampleEvent.id,
        importRunId: completedImportRun.id,
        action: "UPDATE",
        previous: { points: 20, status: "pending demo review" },
        next: { points: 25, status: "approved demo row" },
        sourceUrl: fimSnapshot.url,
        createdBy: "demo-importer",
        createdAt: new Date("2026-06-04T08:02:30.000Z"),
      },
      {
        entityType: "EVENT",
        entityId: sampleEvent.id,
        action: "UPDATE",
        previous: { description: "Short demo description" },
        next: { description: "Expanded terrain and elevation demo description" },
        sourceUrl: championshipSnapshot.url,
        createdBy: "demo-admin",
        createdAt: new Date("2026-06-04T08:12:30.000Z"),
      },
      {
        entityType: "EVENT",
        entityId: "demo-new-event-found",
        importRunId: completedImportRun.id,
        action: "CREATE",
        previous: Prisma.JsonNull,
        next: {
          changeType: "new event found",
          name: "Demo future event",
          reviewRequired: true,
        },
        sourceUrl: championshipSnapshot.url,
        createdBy: "demo-importer",
        createdAt: new Date("2026-06-04T08:14:00.000Z"),
      },
    ],
  });

  await prisma.mediaItem.createMany({
    data: [
      {
        type: "YOUTUBE",
        title: "Demo Hard Enduro season preview",
        description: DEMO_NOTE,
        url: "https://www.youtube.com/watch?v=demo-preview",
        thumbnailUrl: "https://example.com/demo/youtube/season-preview.jpg",
        source: "demo YouTube connector",
        provider: "youtube",
        providerId: "demo-preview",
        publishedAt: new Date("2026-06-01T18:00:00.000Z"),
        tags: ["demo", "video", "preview"],
      },
      {
        type: "YOUTUBE",
        title: "Demo Erzbergrodeo highlights",
        description: DEMO_NOTE,
        url: "https://www.youtube.com/watch?v=demo-erzberg",
        thumbnailUrl: "https://example.com/demo/youtube/erzberg.jpg",
        source: "demo YouTube connector",
        provider: "youtube",
        providerId: "demo-erzberg",
        publishedAt: new Date("2026-06-08T18:00:00.000Z"),
        tags: ["demo", "video", "erzbergrodeo"],
      },
    ],
  });

  await prisma.sourceLink.create({
    data: {
      dataSourceId: manualSource.id,
      url: "https://example.com/demo/manual-seed",
      entityType: "SEED_DATA",
      entityId: "expanded-demo-dataset",
      note: DEMO_NOTE,
    },
  });
}

function riderNameBySlug(slug: string) {
  const rider = riders.find((item) => item.slug === slug);
  return rider ? riderName(rider) : "Demo winner pending";
}

function riderName(rider: RiderSeed) {
  return `${rider.firstName} ${rider.lastName}`;
}

function rotateArray<T>(items: T[], startIndex: number) {
  const normalized = ((startIndex % items.length) + items.length) % items.length;
  return [...items.slice(normalized), ...items.slice(0, normalized)];
}

function rotateResults<T>(items: T[], startIndex: number) {
  return rotateArray(items, startIndex);
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatGap(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `+${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function averageFinish(results: Array<{ overallPosition: number | null }>) {
  const positions = results
    .map((result) => result.overallPosition)
    .filter((position): position is number => typeof position === "number");

  if (positions.length === 0) {
    return null;
  }

  return positions.reduce((total, position) => total + position, 0) / positions.length;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
