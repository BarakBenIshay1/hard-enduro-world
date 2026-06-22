import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.dataVersion.deleteMany(),
    prisma.importRun.deleteMany(),
    prisma.sourceLink.deleteMany(),
    prisma.sourceSnapshot.deleteMany(),
    prisma.dataSource.deleteMany(),
    prisma.mediaEntityLink.deleteMany(),
    prisma.mediaItem.deleteMany(),
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

  const austria = await prisma.country.create({
    data: {
      name: "Austria",
      isoCode: "AT",
      slug: "austria",
      continent: "Europe",
    },
  });

  const season = await prisma.season.create({
    data: {
      year: 2026,
      name: "2026 FIM Hard Enduro World Championship",
      status: "UPCOMING",
    },
  });

  const manufacturer = await prisma.manufacturer.create({
    data: {
      name: "KTM",
      slug: "ktm",
      countryId: austria.id,
    },
  });

  const motorcycle = await prisma.motorcycle.create({
    data: {
      manufacturerId: manufacturer.id,
      model: "300 EXC",
      slug: "ktm-300-exc-2026",
      year: 2026,
      engineCc: 300,
      strokeType: "TWO_STROKE",
      description: "Sample motorcycle profile for the foundation dataset.",
    },
  });

  const team = await prisma.team.create({
    data: {
      name: "Red Bull KTM Factory Racing",
      slug: "red-bull-ktm-factory-racing",
      countryId: austria.id,
    },
  });

  const rider = await prisma.rider.create({
    data: {
      firstName: "Manuel",
      lastName: "Lettenbichler",
      slug: "manuel-lettenbichler",
      countryId: austria.id,
      currentMotorcycleId: motorcycle.id,
    },
  });

  await prisma.teamMembership.create({
    data: {
      riderId: rider.id,
      teamId: team.id,
      seasonId: season.id,
    },
  });

  const event = await prisma.event.create({
    data: {
      seasonId: season.id,
      countryId: austria.id,
      name: "Sample Hard Enduro GP",
      slug: "sample-hard-enduro-gp-2026",
      roundNumber: 1,
      city: "Eisenerz",
      venue: "Iron Mountain",
      startDate: new Date("2026-06-01T08:00:00.000Z"),
      endDate: new Date("2026-06-03T18:00:00.000Z"),
      status: "SCHEDULED",
      liveStatus: "UPCOMING",
      description: "Foundation event used to verify the first data model.",
    },
  });

  await prisma.eventTimelineItem.create({
    data: {
      eventId: event.id,
      type: "REGISTRATION_OPEN",
      title: "Registration opens",
      occurredAt: new Date("2026-03-01T08:00:00.000Z"),
    },
  });

  const stage = await prisma.raceStage.create({
    data: {
      eventId: event.id,
      name: "Prologue",
      slug: "prologue",
      stageType: "PROLOGUE",
      stageOrder: 1,
      status: "UPCOMING",
      distanceKm: 5.5,
    },
  });

  await prisma.stageResult.create({
    data: {
      stageId: stage.id,
      riderId: rider.id,
      motorcycleId: motorcycle.id,
      manufacturerId: manufacturer.id,
      className: "Pro",
      overallPosition: 1,
      classPosition: 1,
      totalTimeMs: 312000,
      totalTimeText: "05:12.000",
      status: "FINISHED",
      officialRawRow: {
        position: "1",
        rider: "Manuel Lettenbichler",
        time: "05:12.000",
      },
    },
  });

  await prisma.result.create({
    data: {
      eventId: event.id,
      riderId: rider.id,
      motorcycleId: motorcycle.id,
      manufacturerId: manufacturer.id,
      className: "Pro",
      overallPosition: 1,
      classPosition: 1,
      points: 20,
      totalTimeText: "Official final classification pending",
      status: "FINISHED",
    },
  });

  await prisma.standing.create({
    data: {
      seasonId: season.id,
      riderId: rider.id,
      className: "Pro",
      position: 1,
      points: 20,
      wins: 1,
      podiums: 1,
      starts: 1,
    },
  });

  await prisma.riderCareerSeason.create({
    data: {
      riderId: rider.id,
      seasonId: season.id,
      teamId: team.id,
      manufacturerId: manufacturer.id,
      motorcycleId: motorcycle.id,
      className: "Pro",
      championshipPosition: 1,
      points: 20,
      wins: 1,
      podiums: 1,
      starts: 1,
    },
  });

  const sampleRiders = [
    {
      firstName: "Mario",
      lastName: "Roman",
      slug: "mario-roman",
      country: { name: "Spain", isoCode: "ES", slug: "spain" },
      team: "Factory Sherco Racing",
      teamSlug: "factory-sherco-racing",
      manufacturer: "Sherco",
      manufacturerSlug: "sherco",
      motorcycle: "300 SE Factory",
      motorcycleSlug: "sherco-300-se-factory-2026",
      position: 2,
      points: 17,
      wins: 0,
      podiums: 1,
      starts: 1,
      dnfs: 0,
      timeMs: 326000,
      timeText: "05:26.000",
      gapText: "+00:14.000",
    },
    {
      firstName: "Billy",
      lastName: "Bolt",
      slug: "billy-bolt",
      country: { name: "United Kingdom", isoCode: "GB", slug: "united-kingdom" },
      team: "Husqvarna Factory Racing",
      teamSlug: "husqvarna-factory-racing",
      manufacturer: "Husqvarna",
      manufacturerSlug: "husqvarna",
      motorcycle: "TE 300",
      motorcycleSlug: "husqvarna-te-300-2026",
      position: 3,
      points: 15,
      wins: 0,
      podiums: 1,
      starts: 1,
      dnfs: 0,
      timeMs: 337000,
      timeText: "05:37.000",
      gapText: "+00:25.000",
    },
    {
      firstName: "Trystan",
      lastName: "Hart",
      slug: "trystan-hart",
      country: { name: "Canada", isoCode: "CA", slug: "canada" },
      team: "FMF KTM Factory Racing",
      teamSlug: "fmf-ktm-factory-racing",
      manufacturer: "KTM",
      manufacturerSlug: "ktm",
      motorcycle: "300 XC-W",
      motorcycleSlug: "ktm-300-xc-w-2026",
      position: 4,
      points: 13,
      wins: 0,
      podiums: 0,
      starts: 1,
      dnfs: 0,
      timeMs: 348000,
      timeText: "05:48.000",
      gapText: "+00:36.000",
    },
    {
      firstName: "Wade",
      lastName: "Young",
      slug: "wade-young",
      country: { name: "South Africa", isoCode: "ZA", slug: "south-africa" },
      team: "Rieju Factory Racing",
      teamSlug: "rieju-factory-racing",
      manufacturer: "Rieju",
      manufacturerSlug: "rieju",
      motorcycle: "MR 300 Racing",
      motorcycleSlug: "rieju-mr-300-racing-2026",
      position: 5,
      points: 11,
      wins: 0,
      podiums: 0,
      starts: 1,
      dnfs: 0,
      timeMs: 363000,
      timeText: "06:03.000",
      gapText: "+00:51.000",
    },
    {
      firstName: "Jonny",
      lastName: "Walker",
      slug: "jonny-walker",
      country: { name: "United Kingdom", isoCode: "GB", slug: "united-kingdom" },
      team: "Beta Factory Racing",
      teamSlug: "beta-factory-racing",
      manufacturer: "Beta",
      manufacturerSlug: "beta",
      motorcycle: "RR 300 Racing",
      motorcycleSlug: "beta-rr-300-racing-2026",
      position: 6,
      points: 10,
      wins: 0,
      podiums: 0,
      starts: 1,
      dnfs: 0,
      timeMs: 378000,
      timeText: "06:18.000",
      gapText: "+01:06.000",
    },
    {
      firstName: "Lettenbichler Demo",
      lastName: "Privateer",
      slug: "demo-privateer-rider",
      country: { name: "United States", isoCode: "US", slug: "united-states" },
      team: "Independent Hard Enduro",
      teamSlug: "independent-hard-enduro",
      manufacturer: "KTM",
      manufacturerSlug: "ktm",
      motorcycle: "300 EXC Privateer",
      motorcycleSlug: "ktm-300-exc-privateer-2026",
      position: null,
      points: 0,
      wins: 0,
      podiums: 0,
      starts: 1,
      dnfs: 1,
      timeMs: null,
      timeText: null,
      gapText: null,
    },
  ];

  for (const sample of sampleRiders) {
    const sampleCountry = await prisma.country.upsert({
      where: { slug: sample.country.slug },
      update: {},
      create: {
        name: sample.country.name,
        isoCode: sample.country.isoCode,
        slug: sample.country.slug,
        continent: sample.country.isoCode === "ZA" ? "Africa" : "Europe",
      },
    });

    const sampleManufacturer = await prisma.manufacturer.upsert({
      where: { slug: sample.manufacturerSlug },
      update: {},
      create: {
        name: sample.manufacturer,
        slug: sample.manufacturerSlug,
        countryId: sampleCountry.id,
      },
    });

    const sampleMotorcycle = await prisma.motorcycle.create({
      data: {
        manufacturerId: sampleManufacturer.id,
        model: sample.motorcycle,
        slug: sample.motorcycleSlug,
        year: 2026,
        engineCc: 300,
        strokeType: "TWO_STROKE",
        description: "Sample/demo motorcycle assignment for Step 7 rider module.",
      },
    });

    const sampleTeam = await prisma.team.create({
      data: {
        name: sample.team,
        slug: sample.teamSlug,
        countryId: sampleCountry.id,
      },
    });

    const sampleRider = await prisma.rider.create({
      data: {
        firstName: sample.firstName,
        lastName: sample.lastName,
        slug: sample.slug,
        countryId: sampleCountry.id,
        currentMotorcycleId: sampleMotorcycle.id,
        birthDate: new Date("1995-01-01T00:00:00.000Z"),
      },
    });

    await prisma.teamMembership.create({
      data: {
        riderId: sampleRider.id,
        teamId: sampleTeam.id,
        seasonId: season.id,
      },
    });

    await prisma.stageResult.create({
      data: {
        stageId: stage.id,
        riderId: sampleRider.id,
        motorcycleId: sampleMotorcycle.id,
        manufacturerId: sampleManufacturer.id,
        className: "Pro",
        overallPosition: sample.position,
        classPosition: sample.position,
        totalTimeMs: sample.timeMs,
        totalTimeText: sample.timeText,
        gapToLeaderText: sample.gapText,
        status: sample.dnfs > 0 ? "DNF" : "FINISHED",
        officialRawRow: {
          sample: true,
          rider: `${sample.firstName} ${sample.lastName}`,
          time: sample.timeText,
        },
      },
    });

    await prisma.result.create({
      data: {
        eventId: event.id,
        riderId: sampleRider.id,
        motorcycleId: sampleMotorcycle.id,
        manufacturerId: sampleManufacturer.id,
        className: "Pro",
        overallPosition: sample.position,
        classPosition: sample.position,
        points: sample.points,
        totalTimeText: sample.timeText ?? "DNF",
        status: sample.dnfs > 0 ? "DNF" : "FINISHED",
      },
    });

    await prisma.standing.create({
      data: {
        seasonId: season.id,
        riderId: sampleRider.id,
        className: "Pro",
        position: sample.position,
        points: sample.points,
        wins: sample.wins,
        podiums: sample.podiums,
        starts: sample.starts,
        dnfs: sample.dnfs,
      },
    });

    await prisma.riderCareerSeason.create({
      data: {
        riderId: sampleRider.id,
        seasonId: season.id,
        teamId: sampleTeam.id,
        manufacturerId: sampleManufacturer.id,
        motorcycleId: sampleMotorcycle.id,
        className: "Pro",
        championshipPosition: sample.position,
        points: sample.points,
        wins: sample.wins,
        podiums: sample.podiums,
        starts: sample.starts,
        dnfs: sample.dnfs,
      },
    });
  }

  const demoManufacturers = [
    {
      name: "GASGAS",
      slug: "gasgas",
      country: { name: "Spain", isoCode: "ES", slug: "spain", continent: "Europe" },
      motorcycle: {
        model: "EC 300",
        slug: "gasgas-ec-300-2026",
        engineCc: 300,
        strokeType: "TWO_STROKE" as const,
      },
    },
    {
      name: "TM Racing",
      slug: "tm-racing",
      country: { name: "Italy", isoCode: "IT", slug: "italy", continent: "Europe" },
      motorcycle: {
        model: "EN 300 ES",
        slug: "tm-racing-en-300-es-2026",
        engineCc: 300,
        strokeType: "TWO_STROKE" as const,
      },
    },
    {
      name: "Honda",
      slug: "honda",
      country: { name: "Japan", isoCode: "JP", slug: "japan", continent: "Asia" },
      motorcycle: {
        model: "CRF450RX",
        slug: "honda-crf450rx-2026",
        engineCc: 450,
        strokeType: "FOUR_STROKE" as const,
      },
    },
    {
      name: "Fantic",
      slug: "fantic",
      country: { name: "Italy", isoCode: "IT", slug: "italy", continent: "Europe" },
      motorcycle: {
        model: "XEF 310",
        slug: "fantic-xef-310-2026",
        engineCc: 310,
        strokeType: "FOUR_STROKE" as const,
      },
    },
  ];

  for (const demo of demoManufacturers) {
    const demoCountry = await prisma.country.upsert({
      where: { slug: demo.country.slug },
      update: {},
      create: demo.country,
    });

    const demoManufacturer = await prisma.manufacturer.upsert({
      where: { slug: demo.slug },
      update: {},
      create: {
        name: demo.name,
        slug: demo.slug,
        countryId: demoCountry.id,
      },
    });

    await prisma.motorcycle.upsert({
      where: { slug: demo.motorcycle.slug },
      update: {},
      create: {
        manufacturerId: demoManufacturer.id,
        model: demo.motorcycle.model,
        slug: demo.motorcycle.slug,
        year: 2026,
        engineCc: demo.motorcycle.engineCc,
        strokeType: demo.motorcycle.strokeType,
        description:
          "Sample/demo manufacturer motorcycle preview for Step 9 manufacturer module.",
      },
    });
  }

  await prisma.weatherSnapshot.create({
    data: {
      eventId: event.id,
      temperatureC: 18,
      humidityPercent: 64,
      rainMm: 0,
      windSpeedKmh: 8,
      weatherDescription: "Clear sample conditions",
      provider: "manual-seed",
    },
  });

  const media = await prisma.mediaItem.create({
    data: {
      eventId: event.id,
      type: "IMAGE",
      title: "Sample event image",
      url: "https://example.com/sample-event-image.jpg",
      source: "manual seed",
      provider: "manual",
      tags: ["sample", "event"],
    },
  });

  await prisma.mediaEntityLink.create({
    data: {
      mediaItemId: media.id,
      entityType: "EVENT",
      entityId: event.id,
    },
  });

  const dataSource = await prisma.dataSource.create({
    data: {
      name: "Manual foundation seed",
      type: "MANUAL",
      reliability: "OFFICIAL",
    },
  });

  await prisma.sourceLink.create({
    data: {
      dataSourceId: dataSource.id,
      url: "https://example.com/source",
      entityType: "EVENT",
      entityId: event.id,
      note: "Placeholder source link for the foundation dataset.",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
