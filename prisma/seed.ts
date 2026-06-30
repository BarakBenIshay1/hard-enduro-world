import { PrismaClient } from "@prisma/client";

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
  officialUrl: string;
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
  ["romania", "Romania", "RO", "Europe"],
  ["israel", "Israel", "IL", "Asia"],
  ["united-states", "United States", "US", "North America"],
  ["japan", "Japan", "JP", "Asia"],
  ["france", "France", "FR", "Europe"],
  ["portugal", "Portugal", "PT", "Europe"],
  ["sweden", "Sweden", "SE", "Europe"],
  ["norway", "Norway", "NO", "Europe"],
  ["serbia", "Serbia", "RS", "Europe"],
  ["slovakia", "Slovakia", "SK", "Europe"],
  ["slovenia", "Slovenia", "SI", "Europe"],
  ["croatia", "Croatia", "HR", "Europe"],
  ["greece", "Greece", "GR", "Europe"],
  ["mexico", "Mexico", "MX", "North America"],
  ["chile", "Chile", "CL", "South America"],
  ["australia", "Australia", "AU", "Oceania"],
  ["new-zealand", "New Zealand", "NZ", "Oceania"],
  ["finland", "Finland", "FI", "Europe"],
  ["czech-republic", "Czech Republic", "CZ", "Europe"],
] as const;

const seasons = [
  { year: 2022, name: "2022 FIM Hard Enduro World Championship", status: "COMPLETED" },
  { year: 2023, name: "2023 FIM Hard Enduro World Championship", status: "COMPLETED" },
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

const featuredRiders: RiderSeed[] = [
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

const additionalProfileRiders: RiderSeed[] = [
  {
    firstName: "David",
    lastName: "Knight",
    slug: "david-knight",
    countrySlug: "united-kingdom",
    teamSlug: "privateer-hard-enduro",
    manufacturerSlug: "ktm",
    motorcycleSlug: "ktm-300-exc-2026",
    birthDate: "1978-05-31",
  },
  {
    firstName: "Taddy",
    lastName: "Blazusiak",
    slug: "taddy-blazusiak",
    countrySlug: "poland",
    teamSlug: "gasgas-factory-racing",
    manufacturerSlug: "gasgas",
    motorcycleSlug: "gasgas-ec-300-2026",
    birthDate: "1983-04-26",
  },
  {
    firstName: "Andreas",
    lastName: "Lettenbichler",
    slug: "andreas-lettenbichler",
    countrySlug: "germany",
    teamSlug: "privateer-hard-enduro",
    manufacturerSlug: "ktm",
    motorcycleSlug: "ktm-300-exc-2026",
    birthDate: "1974-09-18",
  },
  {
    firstName: "Paul",
    lastName: "Bolton",
    slug: "paul-bolton",
    countrySlug: "united-kingdom",
    teamSlug: "privateer-hard-enduro",
    manufacturerSlug: "ktm",
    motorcycleSlug: "ktm-300-exc-2026",
    birthDate: "1980-02-09",
  },
  {
    firstName: "Dougie",
    lastName: "Lampkin",
    slug: "dougie-lampkin",
    countrySlug: "united-kingdom",
    teamSlug: "privateer-hard-enduro",
    manufacturerSlug: "beta",
    motorcycleSlug: "beta-rr-300-racing-2026",
    birthDate: "1976-03-23",
  },
  {
    firstName: "Lars",
    lastName: "Enockl",
    slug: "lars-enockl",
    countrySlug: "austria",
    teamSlug: "privateer-hard-enduro",
    manufacturerSlug: "ktm",
    motorcycleSlug: "ktm-300-exc-2026",
    birthDate: "1988-05-22",
  },
  {
    firstName: "Pol",
    lastName: "Tarres",
    slug: "pol-tarres",
    countrySlug: "spain",
    teamSlug: "iberian-extreme-racing",
    manufacturerSlug: "rieju",
    motorcycleSlug: "rieju-mr-300-racing-2026",
    birthDate: "1993-09-29",
  },
  {
    firstName: "Sandra",
    lastName: "Gomez",
    slug: "sandra-gomez",
    countrySlug: "spain",
    teamSlug: "factory-sherco-racing",
    manufacturerSlug: "sherco",
    motorcycleSlug: "sherco-300-se-factory-2026",
    birthDate: "1993-08-06",
  },
  {
    firstName: "Laia",
    lastName: "Sanz",
    slug: "laia-sanz",
    countrySlug: "spain",
    teamSlug: "gasgas-factory-racing",
    manufacturerSlug: "gasgas",
    motorcycleSlug: "gasgas-ec-300-2026",
    birthDate: "1985-12-11",
  },
  {
    firstName: "Cody",
    lastName: "Webb",
    slug: "cody-webb",
    countrySlug: "united-states",
    teamSlug: "fmf-ktm-factory-racing",
    manufacturerSlug: "ktm",
    motorcycleSlug: "ktm-300-xc-w-2026",
    birthDate: "1988-05-31",
  },
  {
    firstName: "Colton",
    lastName: "Haaker",
    slug: "colton-haaker",
    countrySlug: "united-states",
    teamSlug: "husqvarna-factory-racing",
    manufacturerSlug: "husqvarna",
    motorcycleSlug: "husqvarna-te-300-2026",
    birthDate: "1989-09-13",
  },
  {
    firstName: "Taylor",
    lastName: "Robert",
    slug: "taylor-robert",
    countrySlug: "united-states",
    teamSlug: "fmf-ktm-factory-racing",
    manufacturerSlug: "ktm",
    motorcycleSlug: "ktm-300-xc-w-2026",
    birthDate: "1990-07-27",
  },
  {
    firstName: "David",
    lastName: "Cyprian",
    slug: "david-cyprian",
    countrySlug: "czech-republic",
    teamSlug: "privateer-hard-enduro",
    manufacturerSlug: "ktm",
    motorcycleSlug: "ktm-300-exc-2026",
    birthDate: "1990-04-12",
  },
  {
    firstName: "Sonny",
    lastName: "Goggia",
    slug: "sonny-goggia",
    countrySlug: "italy",
    teamSlug: "beta-factory-racing",
    manufacturerSlug: "beta",
    motorcycleSlug: "beta-rr-300-racing-2026",
    birthDate: "1994-02-19",
  },
  {
    firstName: "Francesc",
    lastName: "Moret",
    slug: "francesc-moret",
    countrySlug: "spain",
    teamSlug: "rieju-factory-racing",
    manufacturerSlug: "rieju",
    motorcycleSlug: "rieju-mr-300-racing-2026",
    birthDate: "1992-07-04",
  },
  {
    firstName: "Blake",
    lastName: "Gutzeit",
    slug: "blake-gutzeit",
    countrySlug: "south-africa",
    teamSlug: "privateer-hard-enduro",
    manufacturerSlug: "husqvarna",
    motorcycleSlug: "husqvarna-te-300-2026",
    birthDate: "1994-10-14",
  },
  {
    firstName: "Travis",
    lastName: "Teasdale",
    slug: "travis-teasdale",
    countrySlug: "south-africa",
    teamSlug: "privateer-hard-enduro",
    manufacturerSlug: "gasgas",
    motorcycleSlug: "gasgas-ec-300-2026",
    birthDate: "1996-05-01",
  },
  {
    firstName: "Kevin",
    lastName: "Gallas",
    slug: "kevin-gallas",
    countrySlug: "germany",
    teamSlug: "privateer-hard-enduro",
    manufacturerSlug: "fantic",
    motorcycleSlug: "fantic-xe-300-2026",
    birthDate: "1997-01-21",
  },
  {
    firstName: "Dieter",
    lastName: "Rudolf",
    slug: "dieter-rudolf",
    countrySlug: "austria",
    teamSlug: "privateer-hard-enduro",
    manufacturerSlug: "ktm",
    motorcycleSlug: "ktm-300-exc-2026",
    birthDate: "1989-11-10",
  },
  {
    firstName: "Leon",
    lastName: "Hentschel",
    slug: "leon-hentschel",
    countrySlug: "germany",
    teamSlug: "junior-factory-program",
    manufacturerSlug: "ktm",
    motorcycleSlug: "ktm-300-exc-2026",
    birthDate: "2003-06-17",
  },
  {
    firstName: "Matthew",
    lastName: "Green",
    slug: "matthew-green",
    countrySlug: "south-africa",
    teamSlug: "privateer-hard-enduro",
    manufacturerSlug: "ktm",
    motorcycleSlug: "ktm-300-xc-w-2026",
    birthDate: "1997-12-03",
  },
  {
    firstName: "Marc",
    lastName: "Riba",
    slug: "marc-riba",
    countrySlug: "spain",
    teamSlug: "factory-sherco-racing",
    manufacturerSlug: "sherco",
    motorcycleSlug: "sherco-300-se-factory-2026",
    birthDate: "1995-03-08",
  },
  {
    firstName: "Tim",
    lastName: "Apolle",
    slug: "tim-apolle",
    countrySlug: "germany",
    teamSlug: "beta-factory-racing",
    manufacturerSlug: "beta",
    motorcycleSlug: "beta-rr-300-racing-2026",
    birthDate: "1996-09-15",
  },
  {
    firstName: "Will",
    lastName: "Hoare",
    slug: "will-hoare",
    countrySlug: "united-kingdom",
    teamSlug: "privateer-hard-enduro",
    manufacturerSlug: "husqvarna",
    motorcycleSlug: "husqvarna-te-300-2026",
    birthDate: "1998-04-20",
  },
];

const regionalDemoRiders: RiderSeed[] = [
  [
    "demo-luca-varga",
    "Luca",
    "Varga",
    "romania",
    "carpathian-privateers",
    "ktm",
    "ktm-300-exc-2026",
    "1998-01-11",
  ],
  [
    "demo-noah-stone",
    "Noah",
    "Stone",
    "united-kingdom",
    "rookie-hard-enduro-academy",
    "husqvarna",
    "husqvarna-te-300-2026",
    "2002-02-12",
  ],
  [
    "demo-mateo-santos",
    "Mateo",
    "Santos",
    "portugal",
    "iberian-extreme-racing",
    "gasgas",
    "gasgas-ec-300-2026",
    "1999-03-13",
  ],
  [
    "demo-elias-berg",
    "Elias",
    "Berg",
    "sweden",
    "nordic-enduro-lab",
    "husqvarna",
    "husqvarna-te-300-2026",
    "2000-04-14",
  ],
  [
    "demo-tomas-novak",
    "Tomas",
    "Novak",
    "czech-republic",
    "privateer-hard-enduro",
    "ktm",
    "ktm-300-exc-2026",
    "1996-05-15",
  ],
  [
    "demo-oscar-nilsen",
    "Oscar",
    "Nilsen",
    "norway",
    "nordic-enduro-lab",
    "beta",
    "beta-rr-300-racing-2026",
    "1997-06-16",
  ],
  [
    "demo-niko-petrov",
    "Niko",
    "Petrov",
    "bulgaria",
    "sherco-privateer-racing",
    "sherco",
    "sherco-300-se-factory-2026",
    "2001-07-17",
  ],
  [
    "demo-rafael-costa",
    "Rafael",
    "Costa",
    "portugal",
    "iberian-extreme-racing",
    "rieju",
    "rieju-mr-300-racing-2026",
    "1995-08-18",
  ],
  [
    "demo-arvid-larsson",
    "Arvid",
    "Larsson",
    "sweden",
    "nordic-enduro-lab",
    "fantic",
    "fantic-xe-300-2026",
    "1998-09-19",
  ],
  [
    "demo-felix-moreau",
    "Felix",
    "Moreau",
    "france",
    "alpine-hard-enduro",
    "beta",
    "beta-rr-300-racing-2026",
    "1994-10-20",
  ],
  [
    "demo-samuel-kovac",
    "Samuel",
    "Kovac",
    "slovakia",
    "balkan-hard-enduro",
    "tm-racing",
    "tm-racing-en-300-2026",
    "1997-11-21",
  ],
  [
    "demo-milan-horvat",
    "Milan",
    "Horvat",
    "croatia",
    "balkan-hard-enduro",
    "gasgas",
    "gasgas-ec-300-2026",
    "1999-12-22",
  ],
  [
    "demo-jakub-kral",
    "Jakub",
    "Kral",
    "czech-republic",
    "privateer-hard-enduro",
    "ktm",
    "ktm-300-xc-w-2026",
    "2000-01-23",
  ],
  [
    "demo-liam-fraser",
    "Liam",
    "Fraser",
    "canada",
    "north-american-privateers",
    "ktm",
    "ktm-300-xc-w-2026",
    "1996-02-24",
  ],
  [
    "demo-henrik-niemi",
    "Henrik",
    "Niemi",
    "finland",
    "nordic-enduro-lab",
    "husqvarna",
    "husqvarna-te-300-2026",
    "1995-03-25",
  ],
  [
    "demo-pablo-mendez",
    "Pablo",
    "Mendez",
    "mexico",
    "north-american-privateers",
    "honda",
    "honda-crf450rx-2026",
    "1998-04-01",
  ],
  [
    "demo-diego-vidal",
    "Diego",
    "Vidal",
    "chile",
    "andes-extreme-racing",
    "gasgas",
    "gasgas-ec-300-2026",
    "2001-05-02",
  ],
  [
    "demo-marco-rossi",
    "Marco",
    "Rossi",
    "italy",
    "beta-factory-racing",
    "beta",
    "beta-rr-300-racing-2026",
    "1993-06-03",
  ],
  [
    "demo-ivan-markovic",
    "Ivan",
    "Markovic",
    "serbia",
    "balkan-hard-enduro",
    "sherco",
    "sherco-300-se-factory-2026",
    "1997-07-04",
  ],
  [
    "demo-ruben-herrera",
    "Ruben",
    "Herrera",
    "spain",
    "iberian-extreme-racing",
    "rieju",
    "rieju-mr-300-racing-2026",
    "1996-08-05",
  ],
  [
    "demo-callum-reed",
    "Callum",
    "Reed",
    "united-kingdom",
    "rookie-hard-enduro-academy",
    "fantic",
    "fantic-xe-300-2026",
    "2004-09-06",
  ],
  [
    "demo-evan-bennett",
    "Evan",
    "Bennett",
    "united-states",
    "north-american-privateers",
    "ktm",
    "ktm-300-xc-w-2026",
    "1999-10-07",
  ],
  [
    "demo-ryan-turner",
    "Ryan",
    "Turner",
    "australia",
    "pacific-hard-enduro",
    "gasgas",
    "gasgas-ec-300-2026",
    "1998-11-08",
  ],
  [
    "demo-kian-morris",
    "Kian",
    "Morris",
    "new-zealand",
    "pacific-hard-enduro",
    "husqvarna",
    "husqvarna-te-300-2026",
    "2000-12-09",
  ],
].map(
  ([
    slug,
    firstName,
    lastName,
    countrySlug,
    teamSlug,
    manufacturerSlug,
    motorcycleSlug,
    birthDate,
  ]) => ({
    slug,
    firstName,
    lastName,
    countrySlug,
    teamSlug,
    manufacturerSlug,
    motorcycleSlug,
    birthDate,
  }),
);

const riders: RiderSeed[] = [
  ...featuredRiders,
  ...additionalProfileRiders,
  ...regionalDemoRiders,
];

const extraTeams = [
  [
    "sherco-privateer-racing",
    "Sherco Privateer Racing",
    "bulgaria",
    "https://example.com/demo/sherco-privateer",
  ],
  [
    "moto-club-romania",
    "Moto Club Romania",
    "romania",
    "https://example.com/demo/romania",
  ],
  [
    "alpine-hard-enduro",
    "Alpine Hard Enduro",
    "france",
    "https://example.com/demo/alpine",
  ],
  [
    "iberian-extreme-racing",
    "Iberian Extreme Racing",
    "portugal",
    "https://example.com/demo/iberian",
  ],
  ["nordic-enduro-lab", "Nordic Enduro Lab", "sweden", "https://example.com/demo/nordic"],
  [
    "balkan-hard-enduro",
    "Balkan Hard Enduro",
    "serbia",
    "https://example.com/demo/balkan",
  ],
  [
    "carpathian-privateers",
    "Carpathian Privateers",
    "romania",
    "https://example.com/demo/carpathian",
  ],
  [
    "rookie-hard-enduro-academy",
    "Rookie Hard Enduro Academy",
    "united-kingdom",
    "https://example.com/demo/rookie",
  ],
  [
    "desert-hard-enduro-team",
    "Desert Hard Enduro Team",
    "israel",
    "https://example.com/demo/desert",
  ],
  [
    "andes-extreme-racing",
    "Andes Extreme Racing",
    "chile",
    "https://example.com/demo/andes",
  ],
  [
    "pacific-hard-enduro",
    "Pacific Hard Enduro",
    "australia",
    "https://example.com/demo/pacific",
  ],
  [
    "north-american-privateers",
    "North American Privateers",
    "canada",
    "https://example.com/demo/north-american",
  ],
  [
    "junior-factory-program",
    "Junior Factory Program",
    "germany",
    "https://example.com/demo/junior-factory",
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
  [
    "xl-lagares",
    "XL Lagares",
    "portugal",
    "Porto",
    "Porto urban and river valley course",
    "Urban prologue, granite riverbeds, forest climbs",
    "320 m",
  ],
  [
    "alestrem",
    "Alestrem",
    "france",
    "Ales",
    "Cevennes winter forest",
    "Wet limestone, forest switchbacks, winter enduro climbs",
    "650 m",
  ],
  [
    "xross-hard-enduro",
    "Xross Hard Enduro",
    "serbia",
    "Zlatibor",
    "Balkan mountain ridges",
    "Rocky climbs, alpine meadows, technical forest descents",
    "1,496 m",
  ],
  [
    "red-bull-outliers",
    "Red Bull Outliers",
    "canada",
    "Calgary",
    "Badlands and urban prologue",
    "Coulee climbs, sandstone ledges, river valley terrain",
    "1,045 m",
  ],
  [
    "battle-of-vikings",
    "Battle of Vikings",
    "sweden",
    "Karlskoga",
    "Nordic forest course",
    "Mossy granite, roots, lakeside climbs",
    "250 m",
  ],
  [
    "wildwood-rock-extreme",
    "Wildwood Rock Extreme",
    "australia",
    "Melbourne",
    "Wildwood rock quarry",
    "Basalt boulders, quarry climbs, technical arena laps",
    "310 m",
  ],
  [
    "king-of-the-motos",
    "King of the Motos",
    "united-states",
    "Johnson Valley",
    "Mojave desert rocks",
    "Desert navigation, giant boulders, high-speed sand washes",
    "850 m",
  ],
  [
    "terra-inferno",
    "Terra Inferno",
    "mexico",
    "Monterrey",
    "Sierra Madre canyons",
    "Dry waterfalls, canyon ledges, heat management",
    "1,120 m",
  ],
  [
    "andes-hard-enduro",
    "Andes Hard Enduro",
    "chile",
    "Santiago",
    "Andes foothills",
    "Loose volcanic climbs, high-altitude ridges, dust",
    "2,600 m",
  ],
  [
    "carpathian-hard-enduro",
    "Carpathian Hard Enduro",
    "romania",
    "Brasov",
    "Carpathian forest",
    "Forest switchbacks, river crossings, alpine pasture climbs",
    "1,900 m",
  ],
  [
    "hellas-extreme",
    "Hellas Extreme",
    "greece",
    "Meteora",
    "Meteora rock valleys",
    "Dry limestone, monastery valley climbs, hot prologue",
    "780 m",
  ],
  [
    "slovak-hard-enduro",
    "Slovak Hard Enduro",
    "slovakia",
    "Kosice",
    "Slovak ore mountains",
    "Mine tracks, wet roots, narrow ridge trails",
    "1,100 m",
  ],
] as const;

const eventSeeds: EventSeed[] = [
  ...buildSeasonEvents(2026, "2026", [
    "minus-400",
    "valleys-hard-enduro",
    "xl-lagares",
    "erzbergrodeo",
    "abestone-hard-enduro",
    "red-bull-romaniacs",
    "xross-hard-enduro",
    "red-bull-outliers",
    "tennessee-knockout",
    "sea-to-sky",
    "hixpania-hard-enduro",
    "getzenrodeo",
    "roof-of-africa",
    "wildwood-rock-extreme",
    "terra-inferno",
  ]),
  ...buildSeasonEvents(2025, "2025", [
    "minus-400",
    "valleys-hard-enduro",
    "xl-lagares",
    "erzbergrodeo",
    "red-bull-romaniacs",
    "abestone-hard-enduro",
    "xross-hard-enduro",
    "red-bull-outliers",
    "tennessee-knockout",
    "sea-to-sky",
    "hixpania-hard-enduro",
    "getzenrodeo",
    "roof-of-africa",
    "battle-of-vikings",
    "king-of-the-motos",
  ]),
  ...buildSeasonEvents(2024, "2024", [
    "minus-400",
    "valleys-hard-enduro",
    "xl-lagares",
    "erzbergrodeo",
    "red-bull-romaniacs",
    "abestone-hard-enduro",
    "xross-hard-enduro",
    "tennessee-knockout",
    "hixpania-hard-enduro",
    "sea-to-sky",
    "getzenrodeo",
    "roof-of-africa",
    "wildwood-rock-extreme",
  ]),
  ...buildSeasonEvents(2023, "2023", [
    "xl-lagares",
    "alestrem",
    "erzbergrodeo",
    "red-bull-romaniacs",
    "sea-to-sky",
    "hixpania-hard-enduro",
    "getzenrodeo",
    "roof-of-africa",
    "battle-of-vikings",
    "carpathian-hard-enduro",
  ]),
  ...buildSeasonEvents(2022, "2022", [
    "alestrem",
    "xl-lagares",
    "erzbergrodeo",
    "red-bull-romaniacs",
    "sea-to-sky",
    "hixpania-hard-enduro",
    "getzenrodeo",
    "roof-of-africa",
    "slovak-hard-enduro",
    "hellas-extreme",
  ]),
];

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

  for (const [slug, name, isoCode, continent] of countries) {
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
        description: `${DEMO_NOTE} Event metadata placeholder only. Terrain: ${seed.terrain}. Elevation: ${seed.elevation}. No winner, podium, points, standings, or timing data is generated by seed data.`,
      },
    });
    eventMap.set(seed.slug, event);

    await seedEventTimeline(event.id, seed);
    await seedWeather(event.id, seed.roundNumber);
    await seedEventMedia(event.id, seed);

    await seedScheduleStages(event.id, seed);
  }

  await seedMembershipsAndCareers();
  await seedSourcesAndAudit(eventMap);

  console.log(
    `Seed complete: ${eventSeeds.length} metadata-only events, ${riders.length} rider profile placeholders, no synthetic historical results.`,
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
    "xl-lagares": [`${year}-05-02`, `${year}-05-04`],
    alestrem: [`${year}-01-25`, `${year}-01-26`],
    "xross-hard-enduro": [`${year}-06-12`, `${year}-06-14`],
    "red-bull-outliers": [`${year}-08-22`, `${year}-08-24`],
    "battle-of-vikings": [`${year}-09-06`, `${year}-09-07`],
    "wildwood-rock-extreme": [`${year}-11-08`, `${year}-11-08`],
    "king-of-the-motos": [`${year}-02-13`, `${year}-02-15`],
    "terra-inferno": [`${year}-03-21`, `${year}-03-22`],
    "andes-hard-enduro": [`${year}-12-05`, `${year}-12-07`],
    "carpathian-hard-enduro": [`${year}-09-19`, `${year}-09-21`],
    "hellas-extreme": [`${year}-04-11`, `${year}-04-12`],
    "slovak-hard-enduro": [`${year}-09-27`, `${year}-09-28`],
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
      officialUrl: `https://example.com/demo/events/${baseSlug}-${year}`,
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
        type: "OFFICIAL_DOCUMENT",
        title: "Official document placeholder",
        description:
          "Schedule/document placeholder only. No seeded historical classification is generated.",
        occurredAt: start,
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

async function seedScheduleStages(eventId: string, seed: EventSeed) {
  const stageSeeds = [
    ["prologue", "Prologue", "PROLOGUE", 1, 6.2],
    ["day-1", "Day 1", "DAY", 2, 58],
    ["day-2", "Day 2", "DAY", 3, 64],
    ["final", "Final", "FINAL", 4, 42],
  ] as const;

  for (const [slug, name, stageType, stageOrder, distanceKm] of stageSeeds) {
    await prisma.raceStage.create({
      data: {
        eventId,
        name,
        slug,
        stageType,
        stageOrder,
        status: seed.liveStatus === "FINISHED" ? "FINISHED" : "UPCOMING",
        startDate: new Date(
          `${seed.startDate}T0${Math.min(stageOrder + 7, 9)}:00:00.000Z`,
        ),
        endDate: new Date(`${seed.startDate}T1${Math.min(stageOrder, 9)}:30:00.000Z`),
        distanceKm,
        officialUrl: `${seed.officialUrl}#${slug}`,
        notes:
          "Schedule placeholder only. No seeded timing, rider classification, winner, podium, or points are generated.",
      },
    });
  }
}

const prismaRiderMap = new Map<string, { id: string }>();
const prismaMotorcycleMap = new Map<string, { id: string }>();
const prismaManufacturerMap = new Map<string, { id: string }>();

async function seedMembershipsAndCareers() {
  const currentSeason = await prisma.season.findUnique({
    where: {
      year: 2026,
    },
  });

  if (!currentSeason) {
    return;
  }

  for (const rider of riders) {
    const riderRecord = prismaRiderMap.get(rider.slug)!;
    const team = await prisma.team.findUnique({ where: { slug: rider.teamSlug } });
    const manufacturer = prismaManufacturerMap.get(rider.manufacturerSlug)!;
    const motorcycle = prismaMotorcycleMap.get(rider.motorcycleSlug)!;

    await prisma.teamMembership.create({
      data: {
        riderId: riderRecord.id,
        teamId: team!.id,
        seasonId: currentSeason.id,
        startDate: new Date("2026-01-01T00:00:00.000Z"),
      },
    });

    await prisma.riderCareerSeason.create({
      data: {
        riderId: riderRecord.id,
        seasonId: currentSeason.id,
        teamId: team?.id,
        manufacturerId: manufacturer.id,
        motorcycleId: motorcycle.id,
        className: "Pro",
        championshipPosition: null,
        points: 0,
        wins: 0,
        podiums: 0,
        starts: 0,
        dnfs: 0,
        stageWins: 0,
        averageFinishPosition: null,
        statistics: {
          demo: true,
          historicalPolicy: true,
          note: "Profile placeholder only. No historical starts, points, wins, podiums, standings, or results are generated.",
          biography: `${riderName(rider)} has a profile placeholder for UI development. Verified historical results should be imported from official sources before publication.`,
          achievements: [],
          status: "profile placeholder",
          category: "named rider profile placeholder",
        },
      },
    });
  }
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

  const [, timingSnapshot, championshipSnapshot, youtubeSnapshot, weatherSnapshot] =
    await Promise.all([
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

  await prisma.importRun.createMany({
    data: [
      {
        sourceSnapshotId: championshipSnapshot.id,
        jobName: "official-events-demo-calendar-import",
        status: "NEEDS_REVIEW",
        startedAt: new Date("2026-06-04T08:13:00.000Z"),
        recordsFound: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        metadata: {
          demo: true,
          jobId: "official-events",
          autoPublish: false,
          reviewRequired: true,
          historicalPolicy: "Metadata review only. No future seasons or results created.",
        },
      },
      {
        sourceSnapshotId: timingSnapshot.id,
        jobName: "official-results-review-placeholder",
        status: "NEEDS_REVIEW",
        startedAt: new Date("2026-06-04T08:41:00.000Z"),
        recordsFound: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        metadata: {
          demo: true,
          jobId: "official-results",
          riskLevel: "high",
          reviewRequired: true,
          autoPublish: false,
          historicalPolicy:
            "No synthetic result rows are imported. Official results must be verified before publication.",
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
        entityType: "EVENT",
        entityId: sampleEvent.id,
        action: "UPDATE",
        previous: { description: "Short demo description" },
        next: { description: "Expanded terrain and elevation demo description" },
        sourceUrl: championshipSnapshot.url,
        createdBy: "demo-admin",
        createdAt: new Date("2026-06-04T08:12:30.000Z"),
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
      ...Array.from(eventMap.values())
        .slice(0, 12)
        .map((event, index) => ({
          eventId: event.id,
          type: "YOUTUBE" as const,
          title: `${event.name} demo video feature`,
          description: DEMO_NOTE,
          url: `https://www.youtube.com/watch?v=demo-${event.slug}`,
          thumbnailUrl: `https://example.com/demo/youtube/${event.slug}.jpg`,
          source: "demo YouTube connector",
          provider: "youtube",
          providerId: `demo-${event.slug}`,
          publishedAt: new Date(
            `2026-06-${String(index + 10).padStart(2, "0")}T18:00:00.000Z`,
          ),
          tags: ["demo", "video", event.slug],
        })),
      ...Array.from(eventMap.values())
        .slice(12, 24)
        .map((event) => ({
          eventId: event.id,
          type: "DOCUMENT" as const,
          title: `${event.name} demo official PDF`,
          description: DEMO_NOTE,
          url: `https://example.com/demo/documents/${event.slug}.pdf`,
          thumbnailUrl: `https://example.com/demo/documents/${event.slug}.jpg`,
          source: "manual demo seed",
          provider: "manual",
          providerId: `demo-document-${event.slug}`,
          tags: ["demo", "document", event.slug],
        })),
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

function riderName(rider: RiderSeed) {
  return `${rider.firstName} ${rider.lastName}`;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
