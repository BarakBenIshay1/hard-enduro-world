-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'LIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LiveStatus" AS ENUM ('UPCOMING', 'LIVE', 'SUSPENDED', 'FINISHED', 'CANCELLED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EventTimelineType" AS ENUM ('REGISTRATION_OPEN', 'ENTRY_LIST_PUBLISHED', 'START_LIST_PUBLISHED', 'STAGE_STARTED', 'STAGE_FINISHED', 'FINAL_CLASSIFICATION', 'OFFICIAL_DOCUMENT', 'GALLERY', 'VIDEO', 'NEWS', 'POINTS_UPDATED', 'OTHER');

-- CreateEnum
CREATE TYPE "StageType" AS ENUM ('PROLOGUE', 'DAY', 'FINAL', 'QUALIFYING', 'OTHER');

-- CreateEnum
CREATE TYPE "StrokeType" AS ENUM ('TWO_STROKE', 'FOUR_STROKE');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('FINISHED', 'DNF', 'DNS', 'DSQ', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('MOST_WINS', 'MOST_CHAMPIONSHIPS', 'MOST_PODIUMS', 'LONGEST_WINNING_STREAK', 'YOUNGEST_WINNER', 'OLDEST_WINNER', 'MOST_STARTS', 'MOST_DNFS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "HallOfFameType" AS ENUM ('WORLD_CHAMPION', 'LEGEND', 'MOST_WINS', 'MOST_PODIUMS', 'MOST_CHAMPIONSHIPS', 'HISTORIC_RECORD', 'LEGENDARY_EVENT', 'ICONIC_MOTORCYCLE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'YOUTUBE', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OFFICIAL_WEBSITE', 'TIMING_SYSTEM', 'YOUTUBE', 'NEWS', 'MAPS', 'WEATHER', 'MANUAL');

-- CreateEnum
CREATE TYPE "SourceReliability" AS ENUM ('OFFICIAL', 'TRUSTED', 'COMMUNITY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ANALYST', 'EDITOR', 'ADMIN', 'OWNER');

-- CreateEnum
CREATE TYPE "FavoriteType" AS ENUM ('RIDER', 'EVENT', 'TEAM', 'MANUFACTURER', 'MOTORCYCLE', 'COUNTRY');

-- CreateEnum
CREATE TYPE "VersionAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'MANUAL_EDIT', 'ROLLBACK', 'RECALCULATE');

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isoCode" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "continent" TEXT,
    "flagImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SeasonStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "countryId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "roundNumber" INTEGER,
    "city" TEXT,
    "venue" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "liveStatus" "LiveStatus" NOT NULL DEFAULT 'UPCOMING',
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "officialUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceStage" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stageType" "StageType" NOT NULL,
    "stageOrder" INTEGER NOT NULL,
    "status" "LiveStatus" NOT NULL DEFAULT 'UPCOMING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "distanceKm" DECIMAL(65,30),
    "officialUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaceStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTimelineItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "EventTimelineType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3),
    "url" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventTimelineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rider" (
    "id" TEXT NOT NULL,
    "countryId" TEXT,
    "currentMotorcycleId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "profileImageUrl" TEXT,
    "officialUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "countryId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "officialUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manufacturer" (
    "id" TEXT NOT NULL,
    "countryId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manufacturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Motorcycle" (
    "id" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "year" INTEGER,
    "engineCc" INTEGER,
    "strokeType" "StrokeType",
    "weightKg" DECIMAL(65,30),
    "suspensionFront" TEXT,
    "suspensionRear" TEXT,
    "horsepower" DECIMAL(65,30),
    "torqueNm" DECIMAL(65,30),
    "fuelCapacityL" DECIMAL(65,30),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Motorcycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembership" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "seasonId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderCareerSeason" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "teamId" TEXT,
    "manufacturerId" TEXT,
    "motorcycleId" TEXT,
    "className" TEXT,
    "championshipPosition" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "podiums" INTEGER NOT NULL DEFAULT 0,
    "starts" INTEGER NOT NULL DEFAULT 0,
    "dnfs" INTEGER NOT NULL DEFAULT 0,
    "stageWins" INTEGER NOT NULL DEFAULT 0,
    "averageFinishPosition" DECIMAL(65,30),
    "statistics" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderCareerSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotorcycleSeasonStat" (
    "id" TEXT NOT NULL,
    "motorcycleId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "className" TEXT,
    "eventsEntered" INTEGER NOT NULL DEFAULT 0,
    "ridersCount" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "podiums" INTEGER NOT NULL DEFAULT 0,
    "dnfs" INTEGER NOT NULL DEFAULT 0,
    "championshipsWon" INTEGER NOT NULL DEFAULT 0,
    "winPercentage" DECIMAL(65,30),
    "statistics" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MotorcycleSeasonStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturerSeasonStat" (
    "id" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "className" TEXT,
    "championshipsWon" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "podiums" INTEGER NOT NULL DEFAULT 0,
    "starts" INTEGER NOT NULL DEFAULT 0,
    "dnfs" INTEGER NOT NULL DEFAULT 0,
    "winPercentage" DECIMAL(65,30),
    "winsByRider" JSONB,
    "winsByMotorcycle" JSONB,
    "statistics" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturerSeasonStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderComparisonSnapshot" (
    "id" TEXT NOT NULL,
    "riderAId" TEXT NOT NULL,
    "riderBId" TEXT NOT NULL,
    "className" TEXT,
    "winsA" INTEGER NOT NULL DEFAULT 0,
    "winsB" INTEGER NOT NULL DEFAULT 0,
    "podiumsA" INTEGER NOT NULL DEFAULT 0,
    "podiumsB" INTEGER NOT NULL DEFAULT 0,
    "championshipsA" INTEGER NOT NULL DEFAULT 0,
    "championshipsB" INTEGER NOT NULL DEFAULT 0,
    "dnfsA" INTEGER NOT NULL DEFAULT 0,
    "dnfsB" INTEGER NOT NULL DEFAULT 0,
    "averageFinishA" DECIMAL(65,30),
    "averageFinishB" DECIMAL(65,30),
    "commonEvents" INTEGER NOT NULL DEFAULT 0,
    "stageWinsA" INTEGER NOT NULL DEFAULT 0,
    "stageWinsB" INTEGER NOT NULL DEFAULT 0,
    "headToHead" JSONB,
    "timeGapStatistics" JSONB,
    "chartData" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiderComparisonSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageResult" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "motorcycleId" TEXT,
    "manufacturerId" TEXT,
    "className" TEXT,
    "overallPosition" INTEGER,
    "classPosition" INTEGER,
    "totalTimeMs" INTEGER,
    "totalTimeText" TEXT,
    "gapToLeaderMs" INTEGER,
    "gapToLeaderText" TEXT,
    "gapToPreviousMs" INTEGER,
    "gapToPreviousText" TEXT,
    "checkpointsCompleted" INTEGER,
    "penaltiesMs" INTEGER,
    "penaltiesText" TEXT,
    "bonusTimeMs" INTEGER,
    "bonusTimeText" TEXT,
    "averageSpeedKmh" DECIMAL(65,30),
    "status" "ResultStatus" NOT NULL DEFAULT 'FINISHED',
    "notes" TEXT,
    "officialRawRow" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "motorcycleId" TEXT,
    "manufacturerId" TEXT,
    "className" TEXT,
    "overallPosition" INTEGER,
    "classPosition" INTEGER,
    "points" INTEGER,
    "totalTimeMs" INTEGER,
    "totalTimeText" TEXT,
    "gapToLeaderMs" INTEGER,
    "gapToLeaderText" TEXT,
    "gapToPreviousMs" INTEGER,
    "gapToPreviousText" TEXT,
    "penaltiesMs" INTEGER,
    "bonusTimeMs" INTEGER,
    "checkpointsCompleted" INTEGER,
    "averageSpeedKmh" DECIMAL(65,30),
    "status" "ResultStatus" NOT NULL DEFAULT 'FINISHED',
    "notes" TEXT,
    "officialRawRow" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Standing" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "className" TEXT,
    "position" INTEGER,
    "points" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "podiums" INTEGER NOT NULL DEFAULT 0,
    "starts" INTEGER NOT NULL DEFAULT 0,
    "dnfs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Standing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChampionshipRecord" (
    "id" TEXT NOT NULL,
    "type" "RecordType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "seasonId" TEXT,
    "className" TEXT,
    "valueNumber" DECIMAL(65,30),
    "valueText" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChampionshipRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HallOfFameEntry" (
    "id" TEXT NOT NULL,
    "type" "HallOfFameType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "rank" INTEGER,
    "summary" TEXT,
    "recordId" TEXT,
    "metadata" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HallOfFameEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherSnapshot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "temperatureC" DECIMAL(65,30),
    "humidityPercent" DECIMAL(65,30),
    "rainMm" DECIMAL(65,30),
    "windSpeedKmh" DECIMAL(65,30),
    "weatherDescription" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT,
    "rawPayload" JSONB,

    CONSTRAINT "WeatherSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "type" "MediaType" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "photographer" TEXT,
    "copyrightOwner" TEXT,
    "license" TEXT,
    "source" TEXT,
    "provider" TEXT,
    "providerId" TEXT,
    "dateTaken" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaEntityLink" (
    "id" TEXT NOT NULL,
    "mediaItemId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaEntityLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT,
    "sourceUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "baseUrl" TEXT,
    "reliability" "SourceReliability" NOT NULL DEFAULT 'OFFICIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceSnapshot" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "rawContent" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusCode" INTEGER,
    "errorMessage" TEXT,

    CONSTRAINT "SourceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceLink" (
    "id" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL,
    "sourceSnapshotId" TEXT,
    "jobName" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "recordsFound" INTEGER NOT NULL DEFAULT 0,
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsSkipped" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataVersion" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "importRunId" TEXT,
    "action" "VersionAction" NOT NULL,
    "previous" JSONB,
    "next" JSONB,
    "sourceUrl" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" "FavoriteType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "notify" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "upcomingRaces" BOOLEAN NOT NULL DEFAULT true,
    "publishedResults" BOOLEAN NOT NULL DEFAULT true,
    "newVideos" BOOLEAN NOT NULL DEFAULT true,
    "newsArticles" BOOLEAN NOT NULL DEFAULT true,
    "riderUpdates" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlugRedirect" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "newSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlugRedirect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_isoCode_key" ON "Country"("isoCode");

-- CreateIndex
CREATE UNIQUE INDEX "Country_slug_key" ON "Country"("slug");

-- CreateIndex
CREATE INDEX "Country_name_idx" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Season_year_key" ON "Season"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_seasonId_idx" ON "Event"("seasonId");

-- CreateIndex
CREATE INDEX "Event_countryId_idx" ON "Event"("countryId");

-- CreateIndex
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");

-- CreateIndex
CREATE INDEX "RaceStage_eventId_idx" ON "RaceStage"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "RaceStage_eventId_slug_key" ON "RaceStage"("eventId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "RaceStage_eventId_stageOrder_key" ON "RaceStage"("eventId", "stageOrder");

-- CreateIndex
CREATE INDEX "EventTimelineItem_eventId_idx" ON "EventTimelineItem"("eventId");

-- CreateIndex
CREATE INDEX "EventTimelineItem_occurredAt_idx" ON "EventTimelineItem"("occurredAt");

-- CreateIndex
CREATE INDEX "EventTimelineItem_type_idx" ON "EventTimelineItem"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Rider_slug_key" ON "Rider"("slug");

-- CreateIndex
CREATE INDEX "Rider_countryId_idx" ON "Rider"("countryId");

-- CreateIndex
CREATE INDEX "Rider_lastName_firstName_idx" ON "Rider"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE INDEX "Team_countryId_idx" ON "Team"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "Manufacturer_slug_key" ON "Manufacturer"("slug");

-- CreateIndex
CREATE INDEX "Manufacturer_countryId_idx" ON "Manufacturer"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "Motorcycle_slug_key" ON "Motorcycle"("slug");

-- CreateIndex
CREATE INDEX "Motorcycle_manufacturerId_idx" ON "Motorcycle"("manufacturerId");

-- CreateIndex
CREATE UNIQUE INDEX "Motorcycle_manufacturerId_model_year_key" ON "Motorcycle"("manufacturerId", "model", "year");

-- CreateIndex
CREATE INDEX "TeamMembership_riderId_idx" ON "TeamMembership"("riderId");

-- CreateIndex
CREATE INDEX "TeamMembership_teamId_idx" ON "TeamMembership"("teamId");

-- CreateIndex
CREATE INDEX "RiderCareerSeason_riderId_idx" ON "RiderCareerSeason"("riderId");

-- CreateIndex
CREATE INDEX "RiderCareerSeason_seasonId_idx" ON "RiderCareerSeason"("seasonId");

-- CreateIndex
CREATE INDEX "RiderCareerSeason_teamId_idx" ON "RiderCareerSeason"("teamId");

-- CreateIndex
CREATE INDEX "RiderCareerSeason_motorcycleId_idx" ON "RiderCareerSeason"("motorcycleId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderCareerSeason_riderId_seasonId_className_key" ON "RiderCareerSeason"("riderId", "seasonId", "className");

-- CreateIndex
CREATE INDEX "MotorcycleSeasonStat_motorcycleId_idx" ON "MotorcycleSeasonStat"("motorcycleId");

-- CreateIndex
CREATE INDEX "MotorcycleSeasonStat_seasonId_idx" ON "MotorcycleSeasonStat"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "MotorcycleSeasonStat_motorcycleId_seasonId_className_key" ON "MotorcycleSeasonStat"("motorcycleId", "seasonId", "className");

-- CreateIndex
CREATE INDEX "ManufacturerSeasonStat_manufacturerId_idx" ON "ManufacturerSeasonStat"("manufacturerId");

-- CreateIndex
CREATE INDEX "ManufacturerSeasonStat_seasonId_idx" ON "ManufacturerSeasonStat"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturerSeasonStat_manufacturerId_seasonId_className_key" ON "ManufacturerSeasonStat"("manufacturerId", "seasonId", "className");

-- CreateIndex
CREATE INDEX "RiderComparisonSnapshot_riderAId_riderBId_idx" ON "RiderComparisonSnapshot"("riderAId", "riderBId");

-- CreateIndex
CREATE UNIQUE INDEX "RiderComparisonSnapshot_riderAId_riderBId_className_key" ON "RiderComparisonSnapshot"("riderAId", "riderBId", "className");

-- CreateIndex
CREATE INDEX "StageResult_stageId_idx" ON "StageResult"("stageId");

-- CreateIndex
CREATE INDEX "StageResult_riderId_idx" ON "StageResult"("riderId");

-- CreateIndex
CREATE INDEX "StageResult_motorcycleId_idx" ON "StageResult"("motorcycleId");

-- CreateIndex
CREATE UNIQUE INDEX "StageResult_stageId_riderId_className_key" ON "StageResult"("stageId", "riderId", "className");

-- CreateIndex
CREATE INDEX "Result_eventId_idx" ON "Result"("eventId");

-- CreateIndex
CREATE INDEX "Result_riderId_idx" ON "Result"("riderId");

-- CreateIndex
CREATE INDEX "Result_motorcycleId_idx" ON "Result"("motorcycleId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_eventId_riderId_className_key" ON "Result"("eventId", "riderId", "className");

-- CreateIndex
CREATE INDEX "Standing_seasonId_idx" ON "Standing"("seasonId");

-- CreateIndex
CREATE INDEX "Standing_riderId_idx" ON "Standing"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "Standing_seasonId_riderId_className_key" ON "Standing"("seasonId", "riderId", "className");

-- CreateIndex
CREATE INDEX "ChampionshipRecord_type_idx" ON "ChampionshipRecord"("type");

-- CreateIndex
CREATE INDEX "ChampionshipRecord_entityType_entityId_idx" ON "ChampionshipRecord"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ChampionshipRecord_seasonId_idx" ON "ChampionshipRecord"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "HallOfFameEntry_slug_key" ON "HallOfFameEntry"("slug");

-- CreateIndex
CREATE INDEX "HallOfFameEntry_type_idx" ON "HallOfFameEntry"("type");

-- CreateIndex
CREATE INDEX "HallOfFameEntry_entityType_entityId_idx" ON "HallOfFameEntry"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "WeatherSnapshot_eventId_idx" ON "WeatherSnapshot"("eventId");

-- CreateIndex
CREATE INDEX "WeatherSnapshot_fetchedAt_idx" ON "WeatherSnapshot"("fetchedAt");

-- CreateIndex
CREATE INDEX "MediaItem_eventId_idx" ON "MediaItem"("eventId");

-- CreateIndex
CREATE INDEX "MediaItem_provider_providerId_idx" ON "MediaItem"("provider", "providerId");

-- CreateIndex
CREATE INDEX "MediaEntityLink_mediaItemId_idx" ON "MediaEntityLink"("mediaItemId");

-- CreateIndex
CREATE INDEX "MediaEntityLink_entityType_entityId_idx" ON "MediaEntityLink"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_slug_key" ON "NewsArticle"("slug");

-- CreateIndex
CREATE INDEX "SourceSnapshot_dataSourceId_idx" ON "SourceSnapshot"("dataSourceId");

-- CreateIndex
CREATE INDEX "SourceSnapshot_contentHash_idx" ON "SourceSnapshot"("contentHash");

-- CreateIndex
CREATE INDEX "SourceLink_entityType_entityId_idx" ON "SourceLink"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SourceLink_dataSourceId_idx" ON "SourceLink"("dataSourceId");

-- CreateIndex
CREATE INDEX "DataVersion_entityType_entityId_idx" ON "DataVersion"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "DataVersion_importRunId_idx" ON "DataVersion"("importRunId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE INDEX "UserFavorite_userId_idx" ON "UserFavorite"("userId");

-- CreateIndex
CREATE INDEX "UserFavorite_entityType_entityId_idx" ON "UserFavorite"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavorite_userId_entityType_entityId_key" ON "UserFavorite"("userId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "SlugRedirect_entityType_entityId_idx" ON "SlugRedirect"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "SlugRedirect_entityType_oldSlug_key" ON "SlugRedirect"("entityType", "oldSlug");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceStage" ADD CONSTRAINT "RaceStage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTimelineItem" ADD CONSTRAINT "EventTimelineItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rider" ADD CONSTRAINT "Rider_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rider" ADD CONSTRAINT "Rider_currentMotorcycleId_fkey" FOREIGN KEY ("currentMotorcycleId") REFERENCES "Motorcycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manufacturer" ADD CONSTRAINT "Manufacturer_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Motorcycle" ADD CONSTRAINT "Motorcycle_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderCareerSeason" ADD CONSTRAINT "RiderCareerSeason_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderCareerSeason" ADD CONSTRAINT "RiderCareerSeason_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderCareerSeason" ADD CONSTRAINT "RiderCareerSeason_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderCareerSeason" ADD CONSTRAINT "RiderCareerSeason_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderCareerSeason" ADD CONSTRAINT "RiderCareerSeason_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "Motorcycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotorcycleSeasonStat" ADD CONSTRAINT "MotorcycleSeasonStat_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "Motorcycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotorcycleSeasonStat" ADD CONSTRAINT "MotorcycleSeasonStat_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerSeasonStat" ADD CONSTRAINT "ManufacturerSeasonStat_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerSeasonStat" ADD CONSTRAINT "ManufacturerSeasonStat_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageResult" ADD CONSTRAINT "StageResult_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "RaceStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageResult" ADD CONSTRAINT "StageResult_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageResult" ADD CONSTRAINT "StageResult_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "Motorcycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageResult" ADD CONSTRAINT "StageResult_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "Motorcycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standing" ADD CONSTRAINT "Standing_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standing" ADD CONSTRAINT "Standing_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherSnapshot" ADD CONSTRAINT "WeatherSnapshot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaEntityLink" ADD CONSTRAINT "MediaEntityLink_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceSnapshot" ADD CONSTRAINT "SourceSnapshot_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceLink" ADD CONSTRAINT "SourceLink_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRun" ADD CONSTRAINT "ImportRun_sourceSnapshotId_fkey" FOREIGN KEY ("sourceSnapshotId") REFERENCES "SourceSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataVersion" ADD CONSTRAINT "DataVersion_importRunId_fkey" FOREIGN KEY ("importRunId") REFERENCES "ImportRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
