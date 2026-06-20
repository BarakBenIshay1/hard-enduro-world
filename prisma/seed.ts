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
