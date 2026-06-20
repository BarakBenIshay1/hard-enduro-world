# Hard Enduro World Championship Website - Revised Step 1 Production Plan

## 1. Recommended Architecture

### Product Shape

The website should be built as the world's most complete Hard Enduro knowledge base, not only a promotional website. The core value is trustworthy structured data about seasons, events, race stages, complete timing tables, riders, rider careers, teams, motorcycles, manufacturers, countries, standings, results, records, weather, media, news, source references, and every historical change.

The platform should support:

- Public championship browsing for fans.
- Searchable historical data across every season.
- Full event pages with prologue, day-by-day stages, final classification, maps, videos, gallery, weather, and source links.
- Rider, team, manufacturer, motorcycle, and country profiles.
- Complete rider career history by season.
- Complete motorcycle history by season, rider, event, and result.
- Current and historical standings.
- Complete timing tables exactly as officially published.
- Stage-by-stage rider progression and performance analytics.
- Event lifecycle timelines from registration through final points updates.
- Calculated championship records such as most wins, podiums, starts, DNFs, and streaks.
- Generated Hall of Fame pages based on records, champions, legendary events, and iconic motorcycles.
- Dynamic rider-versus-rider comparison pages.
- Manufacturer dashboards with automatically calculated statistics.
- Stable permanent SEO slugs with redirect support when names change.
- Future authenticated user favorites and notifications.
- Automated official-data ingestion with human review.
- Full audit history for every imported or edited record.
- SEO-focused public pages.
- Responsive and accessible UI with dark mode.

### High-Level Stack

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS.
- **Backend:** Next.js Route Handlers and Server Actions where appropriate.
- **Database:** PostgreSQL.
- **ORM:** Prisma.
- **Auth/Admin:** Supabase Auth, with role-based access for administrators and editors.
- **Storage:** Supabase Storage for galleries, rider images, event images, country flags, documents, and imported media references.
- **Cache:** Redis or Upstash Redis for frequently accessed public data.
- **Hosting:** Vercel.
- **Automation:** GitHub Actions scheduled workflows and Vercel Cron Jobs.
- **Testing:** Playwright for end-to-end testing, plus unit/integration testing later.
- **External Data:** Official championship websites, official timing/results sources, YouTube API, maps provider, weather provider, and verified news/media sources.
- **Observability:** Structured logging, import job logs, source snapshots, error reporting, admin review queues, and ingestion health checks.

### Application Layers

The project should separate concerns clearly:

- **Public web layer:** SEO-friendly pages and UI components.
- **Admin layer:** Review, approve, edit, rollback, and inspect data changes.
- **Domain layer:** Event, stage, timing, rider, motorcycle, team, standings, record, media, source, and versioning logic.
- **History layer:** Rider career history, motorcycle usage history, manufacturer summaries, event timelines, and generated Hall of Fame data.
- **Data access layer:** Prisma queries and repository-style helpers.
- **Cache layer:** Redis-backed cache helpers for expensive public reads.
- **Ingestion layer:** Jobs that collect, normalize, validate, and store official data.
- **AI layer:** Isolated AI services for summaries, previews, comparisons, and editorial assistance.
- **Audit layer:** Change tracking, source tracking, version history, import logs, and rollback support.

### Public Read Flow

Frequently accessed pages should use a read-optimized flow:

```text
Client
  -> Next.js
  -> Redis / Upstash cache
  -> PostgreSQL through Prisma
```

High-value cache targets:

- Current standings.
- Event result pages.
- Rider profiles.
- Rider career history pages.
- Rider comparison pages.
- Historical season pages.
- Championship records.
- Hall of Fame pages.
- Manufacturer dashboards.
- Statistics and chart datasets.
- Country, manufacturer, and motorcycle profile pages.

Cache invalidation should happen after approved admin edits and successful import runs. The project should prefer tagged or key-pattern invalidation rather than relying only on time-based expiry.

### Data Flow For Automation

Automated collection should follow a controlled pipeline:

1. Scheduled job starts.
2. Data source is fetched from an official or trusted source.
3. Raw response is stored as a source snapshot.
4. Parser converts raw data into normalized candidate records.
5. Timing tables are preserved at stage and final-classification level.
6. Candidate records are validated.
7. Differences are calculated against existing database records.
8. Changes are saved as pending updates or auto-approved only when low risk.
9. Every change creates a version record.
10. Affected cache keys are invalidated.
11. Derived records, standings, rider career summaries, motorcycle history summaries, manufacturer statistics, comparison datasets, Hall of Fame entries, and championship records are recalculated.
12. Admin can review source, diff, status, and rollback if needed.

This avoids blindly overwriting championship records and gives the site a trustworthy data foundation.

### AI Services Boundary

AI features should be isolated from the core application. AI should consume approved data and produce draft content or computed summaries, but it should not directly mutate official records without review.

Planned AI services:

- Rider summaries.
- Event summaries.
- Race previews.
- Season summaries.
- Rider comparisons.
- Motorcycle comparisons.
- Hall of Fame narrative drafts.
- Stage performance insights.
- SEO meta draft generation.

AI output should be stored separately from official factual data and marked as generated or editorial content where needed.

### Security Principles

- Keep public reads separate from admin writes.
- Use Supabase Auth for admin/editor access.
- Use role-based authorization checks on every protected server action and route.
- Store external API keys only in environment variables.
- Validate all imported data before saving.
- Keep source snapshots for traceability.
- Preserve official timing tables exactly as published.
- Preserve permanent slugs and create redirects for renamed public entities.
- Keep media rights and attribution metadata with every media asset.
- Rate-limit public API endpoints if exposed.
- Use Prisma migrations for controlled database changes.
- Never trust automation or AI output without validation, review rules, and audit history.

### UX/UI Direction

The UI should feel like a premium sports data product:

- Fast navigation between seasons, events, stages, riders, rider careers, motorcycles, manufacturers, standings, records, Hall of Fame, and history.
- Dense but readable timing tables for prologues, race days, checkpoints, penalties, and final classifications.
- Strong visual hierarchy for event pages.
- Clean filters for season, class, rider, team, country, manufacturer, motorcycle, stage, and event type.
- Event timeline views that show how an event evolved before, during, and after race week.
- Comparison pages that make rider head-to-head data easy to understand.
- Manufacturer dashboards that combine stats, charts, riders, motorcycles, and season history.
- Dark mode as a first-class experience.
- Mobile-first race results and standings.
- Maps, weather, charts, and video sections integrated into content pages without clutter.
- SEO pages that still feel useful to humans, not only search engines.

## 2. Clean Scalable Folder Structure

Recommended initial structure:

```text
hard-enduro-world/
  app/
    (public)/
      page.tsx
      events/
        page.tsx
        [slug]/
          page.tsx
          timeline/
            page.tsx
          stages/
            [stageSlug]/
              page.tsx
      riders/
        page.tsx
        [slug]/
          page.tsx
          career/
            page.tsx
      compare/
        riders/
          page.tsx
          [riderA]/
            [riderB]/
              page.tsx
      teams/
        page.tsx
        [slug]/
          page.tsx
      manufacturers/
        page.tsx
        [slug]/
          page.tsx
          dashboard/
            page.tsx
      motorcycles/
        page.tsx
        [slug]/
          page.tsx
          history/
            page.tsx
      countries/
        page.tsx
        [slug]/
          page.tsx
      standings/
        page.tsx
      results/
        page.tsx
      records/
        page.tsx
      hall-of-fame/
        page.tsx
      history/
        page.tsx
      videos/
        page.tsx
      gallery/
        page.tsx
      news/
        page.tsx
    admin/
      layout.tsx
      page.tsx
      imports/
        page.tsx
      sources/
        page.tsx
      review/
        page.tsx
      timing/
        page.tsx
      records/
        page.tsx
      media/
        page.tsx
      slugs/
        page.tsx
      users/
        page.tsx
    api/
      cron/
        ingest-official-data/
          route.ts
        recalculate-records/
          route.ts
        recalculate-derived-stats/
          route.ts
      webhooks/
        route.ts
    layout.tsx
    globals.css

  components/
    ui/
    layout/
    data-table/
    timing-table/
    charts/
    maps/
    media/
    event/
    rider/
    motorcycle/
    manufacturer/
    country/
    standings/
    records/
    hall-of-fame/
    comparison/
    timeline/

  config/
    site.ts
    navigation.ts
    sources.ts
    cache.ts

  db/
    prisma.ts
    repositories/
      countries.ts
      events.ts
      motorcycles.ts
      riders.ts
      stages.ts
      standings.ts
      records.ts
      careers.ts
      comparisons.ts
      favorites.ts
      media.ts
      slugs.ts
      sources.ts

  domain/
    countries/
      types.ts
      service.ts
      validation.ts
    events/
      types.ts
      service.ts
      timeline.ts
      validation.ts
    stages/
      types.ts
      service.ts
      timing.ts
      validation.ts
    riders/
      types.ts
      service.ts
      career.ts
      comparison.ts
      validation.ts
    motorcycles/
      types.ts
      service.ts
      history.ts
      validation.ts
    manufacturers/
      service.ts
      dashboard.ts
      calculations.ts
    standings/
      service.ts
      calculations.ts
    records/
      service.ts
      calculations.ts
    hall-of-fame/
      service.ts
      generation.ts
    media/
      metadata.ts
      rights.ts
    slugs/
      permanent-slugs.ts
      redirects.ts
    favorites/
      service.ts
      notifications.ts
    ingestion/
      types.ts
      diff.ts
      validation.ts
      versioning.ts

  jobs/
    ingest/
      official-events.ts
      official-results.ts
      official-stage-results.ts
      official-standings.ts
      youtube.ts
      maps.ts
      weather.ts
    derived/
      rider-careers.ts
      motorcycle-history.ts
      manufacturer-stats.ts
      hall-of-fame.ts
      rider-comparisons.ts
    parsers/
      official-event-parser.ts
      official-stage-results-parser.ts
      official-final-classification-parser.ts
      youtube-parser.ts
    ai/
      rider-summary.ts
      event-summary.ts
      race-preview.ts
      season-summary.ts
      compare-riders.ts
      motorcycle-comparison.ts

  lib/
    auth.ts
    cache.ts
    env.ts
    seo.ts
    slug.ts
    redirects.ts
    dates.ts
    errors.ts
    logger.ts
    permissions.ts

  prisma/
    schema.prisma
    migrations/
    seed.ts

  public/
    images/
    icons/
    flags/

  tests/
    e2e/
    fixtures/
      official-timing/

  .github/
    workflows/
      ci.yml
      scheduled-ingestion.yml
      scheduled-records.yml

  docs/
    architecture.md
    data-sources.md
    admin-workflows.md
    timing-model.md
    caching.md
    ai-services.md
    live-status.md
    slug-policy.md
    media-rights.md
    favorites-and-notifications.md
    derived-statistics.md
    seo-plan.md
    coding-standards.md
    contributing.md

  docker-compose.yml
  .env.example
  package.json
  playwright.config.ts
  tailwind.config.ts
  tsconfig.json
  next.config.ts
```

### Structure Rationale

- `app/` owns routes and page composition.
- `components/` owns reusable UI.
- `domain/` owns business logic and validation.
- `db/` owns Prisma access patterns.
- `jobs/ingest/` owns automated data collection.
- `jobs/ai/` isolates AI services from official data workflows.
- `lib/cache.ts` centralizes Redis/Upstash cache behavior.
- `prisma/` owns schema, migrations, and seeds.
- `docs/` keeps architectural decisions readable as the project grows.
- `.github/workflows/` separates CI, ingestion, and derived-data automation.

## 3. Initial Database Schema

This is the recommended first schema model. It should be treated as the foundation, not the final version. The most important decision is that full stage timing and final event classification are first-class data, not an afterthought.

```prisma
model Country {
  id           String   @id @default(cuid())
  name         String
  isoCode      String   @unique
  slug         String   @unique
  continent    String?
  flagImageUrl String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  riders        Rider[]
  teams         Team[]
  events        Event[]
  manufacturers Manufacturer[]
  @@index([name])
}

model Season {
  id        String       @id @default(cuid())
  year      Int          @unique
  name      String
  status    SeasonStatus @default(UPCOMING)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  events    Event[]
  standings Standing[]
  riderCareerSeasons RiderCareerSeason[]
  motorcycleSeasonStats MotorcycleSeasonStat[]
  manufacturerSeasonStats ManufacturerSeasonStat[]
}

model Event {
  id              String      @id @default(cuid())
  seasonId        String
  countryId       String?
  name            String
  slug            String      @unique
  roundNumber     Int?
  city            String?
  venue           String?
  startDate       DateTime
  endDate         DateTime?
  status          EventStatus @default(SCHEDULED)
  liveStatus      LiveStatus  @default(UPCOMING)
  latitude        Decimal?
  longitude       Decimal?
  officialUrl     String?
  description     String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  season          Season      @relation(fields: [seasonId], references: [id])
  country         Country?    @relation(fields: [countryId], references: [id])
  stages          RaceStage[]
  timelineItems   EventTimelineItem[]
  results         Result[]
  weatherSnapshots WeatherSnapshot[]
  mediaItems      MediaItem[]
  sourceLinks     SourceLink[]
  versions        DataVersion[]

  @@index([seasonId])
  @@index([countryId])
  @@index([startDate])
}

model RaceStage {
  id              String      @id @default(cuid())
  eventId         String
  name            String
  slug            String
  stageType       StageType
  stageOrder      Int
  status          LiveStatus  @default(UPCOMING)
  startDate       DateTime?
  endDate         DateTime?
  distanceKm      Decimal?
  officialUrl     String?
  notes           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  event           Event       @relation(fields: [eventId], references: [id])
  stageResults    StageResult[]
  sourceLinks     SourceLink[]
  versions        DataVersion[]

  @@index([eventId])
  @@unique([eventId, slug])
  @@unique([eventId, stageOrder])
}

model EventTimelineItem {
  id          String            @id @default(cuid())
  eventId     String
  type        EventTimelineType
  title       String
  description String?
  occurredAt  DateTime?
  url         String?
  metadata    Json?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  event       Event             @relation(fields: [eventId], references: [id])
  sourceLinks SourceLink[]

  @@index([eventId])
  @@index([occurredAt])
  @@index([type])
}

model Rider {
  id                  String   @id @default(cuid())
  countryId           String?
  currentMotorcycleId String?
  firstName           String
  lastName            String
  slug                String   @unique
  birthDate           DateTime?
  profileImageUrl     String?
  officialUrl         String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  country             Country?     @relation(fields: [countryId], references: [id])
  currentMotorcycle   Motorcycle?  @relation("CurrentRiderMotorcycle", fields: [currentMotorcycleId], references: [id])
  results             Result[]
  stageResults        StageResult[]
  standings           Standing[]
  careerSeasons       RiderCareerSeason[]
  teamMemberships     TeamMembership[]
  versions            DataVersion[]

  @@index([countryId])
  @@index([lastName, firstName])
}

model Team {
  id          String   @id @default(cuid())
  countryId   String?
  name        String
  slug        String   @unique
  officialUrl String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  country     Country? @relation(fields: [countryId], references: [id])
  memberships TeamMembership[]
  careerSeasons RiderCareerSeason[]

  @@index([countryId])
}

model Manufacturer {
  id        String   @id @default(cuid())
  countryId String?
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  country      Country?     @relation(fields: [countryId], references: [id])
  motorcycles  Motorcycle[]
  results      Result[]
  stageResults StageResult[]
  riderCareerSeasons RiderCareerSeason[]
  seasonStats  ManufacturerSeasonStat[]

  @@index([countryId])
}

model Motorcycle {
  id              String     @id @default(cuid())
  manufacturerId  String
  model           String
  slug            String
  year            Int?
  engineCc        Int?
  strokeType      StrokeType?
  weightKg        Decimal?
  suspensionFront String?
  suspensionRear  String?
  horsepower      Decimal?
  torqueNm        Decimal?
  fuelCapacityL   Decimal?
  description     String?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  manufacturer    Manufacturer @relation(fields: [manufacturerId], references: [id])
  currentRiders   Rider[]      @relation("CurrentRiderMotorcycle")
  results         Result[]
  stageResults    StageResult[]
  riderCareerSeasons RiderCareerSeason[]
  seasonStats     MotorcycleSeasonStat[]
  versions        DataVersion[]

  @@index([manufacturerId])
  @@unique([manufacturerId, model, year])
}

model TeamMembership {
  id        String   @id @default(cuid())
  riderId   String
  teamId    String
  seasonId  String?
  startDate DateTime?
  endDate   DateTime?

  rider     Rider    @relation(fields: [riderId], references: [id])
  team      Team     @relation(fields: [teamId], references: [id])

  @@index([riderId])
  @@index([teamId])
}

model RiderCareerSeason {
  id                     String   @id @default(cuid())
  riderId                String
  seasonId               String
  teamId                 String?
  manufacturerId         String?
  motorcycleId           String?
  className              String?
  championshipPosition   Int?
  points                 Int      @default(0)
  wins                   Int      @default(0)
  podiums                Int      @default(0)
  starts                 Int      @default(0)
  dnfs                   Int      @default(0)
  stageWins              Int      @default(0)
  averageFinishPosition  Decimal?
  statistics             Json?
  calculatedAt           DateTime @default(now())
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  rider                  Rider    @relation(fields: [riderId], references: [id])
  season                 Season   @relation(fields: [seasonId], references: [id])
  team                   Team?    @relation(fields: [teamId], references: [id])
  manufacturer           Manufacturer? @relation(fields: [manufacturerId], references: [id])
  motorcycle             Motorcycle? @relation(fields: [motorcycleId], references: [id])

  @@index([riderId])
  @@index([seasonId])
  @@index([teamId])
  @@index([motorcycleId])
  @@unique([riderId, seasonId, className])
}

model MotorcycleSeasonStat {
  id                    String   @id @default(cuid())
  motorcycleId           String
  seasonId               String
  className              String?
  eventsEntered          Int      @default(0)
  ridersCount            Int      @default(0)
  wins                   Int      @default(0)
  podiums                Int      @default(0)
  dnfs                   Int      @default(0)
  championshipsWon       Int      @default(0)
  winPercentage          Decimal?
  statistics             Json?
  calculatedAt           DateTime @default(now())
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  motorcycle             Motorcycle @relation(fields: [motorcycleId], references: [id])
  season                 Season     @relation(fields: [seasonId], references: [id])

  @@index([motorcycleId])
  @@index([seasonId])
  @@unique([motorcycleId, seasonId, className])
}

model ManufacturerSeasonStat {
  id                    String   @id @default(cuid())
  manufacturerId         String
  seasonId               String
  className              String?
  championshipsWon       Int      @default(0)
  wins                   Int      @default(0)
  podiums                Int      @default(0)
  starts                 Int      @default(0)
  dnfs                   Int      @default(0)
  winPercentage          Decimal?
  winsByRider            Json?
  winsByMotorcycle       Json?
  statistics             Json?
  calculatedAt           DateTime @default(now())
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  manufacturer           Manufacturer @relation(fields: [manufacturerId], references: [id])
  season                 Season       @relation(fields: [seasonId], references: [id])

  @@index([manufacturerId])
  @@index([seasonId])
  @@unique([manufacturerId, seasonId, className])
}

model RiderComparisonSnapshot {
  id                  String   @id @default(cuid())
  riderAId            String
  riderBId            String
  className           String?
  winsA               Int      @default(0)
  winsB               Int      @default(0)
  podiumsA            Int      @default(0)
  podiumsB            Int      @default(0)
  championshipsA      Int      @default(0)
  championshipsB      Int      @default(0)
  dnfsA               Int      @default(0)
  dnfsB               Int      @default(0)
  averageFinishA      Decimal?
  averageFinishB      Decimal?
  commonEvents        Int      @default(0)
  stageWinsA          Int      @default(0)
  stageWinsB          Int      @default(0)
  headToHead          Json?
  timeGapStatistics   Json?
  chartData           Json?
  calculatedAt        DateTime @default(now())

  @@index([riderAId, riderBId])
  @@unique([riderAId, riderBId, className])
}

model StageResult {
  id                   String       @id @default(cuid())
  stageId              String
  riderId              String
  motorcycleId         String?
  manufacturerId       String?
  className            String?
  overallPosition      Int?
  classPosition        Int?
  totalTimeMs          Int?
  totalTimeText        String?
  gapToLeaderMs        Int?
  gapToLeaderText      String?
  gapToPreviousMs      Int?
  gapToPreviousText    String?
  checkpointsCompleted Int?
  penaltiesMs          Int?
  penaltiesText        String?
  bonusTimeMs          Int?
  bonusTimeText        String?
  averageSpeedKmh      Decimal?
  status               ResultStatus @default(FINISHED)
  notes                String?
  officialRawRow       Json?
  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @updatedAt

  stage                RaceStage    @relation(fields: [stageId], references: [id])
  rider                Rider        @relation(fields: [riderId], references: [id])
  motorcycle           Motorcycle?  @relation(fields: [motorcycleId], references: [id])
  manufacturer         Manufacturer? @relation(fields: [manufacturerId], references: [id])
  sourceLinks          SourceLink[]
  versions             DataVersion[]

  @@index([stageId])
  @@index([riderId])
  @@index([motorcycleId])
  @@unique([stageId, riderId, className])
}

model Result {
  id                   String       @id @default(cuid())
  eventId              String
  riderId              String
  motorcycleId         String?
  manufacturerId       String?
  className            String?
  overallPosition      Int?
  classPosition        Int?
  points               Int?
  totalTimeMs          Int?
  totalTimeText        String?
  gapToLeaderMs        Int?
  gapToLeaderText      String?
  gapToPreviousMs      Int?
  gapToPreviousText    String?
  penaltiesMs          Int?
  bonusTimeMs          Int?
  checkpointsCompleted Int?
  averageSpeedKmh      Decimal?
  status               ResultStatus @default(FINISHED)
  notes                String?
  officialRawRow       Json?
  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @updatedAt

  event                Event        @relation(fields: [eventId], references: [id])
  rider                Rider        @relation(fields: [riderId], references: [id])
  motorcycle           Motorcycle?  @relation(fields: [motorcycleId], references: [id])
  manufacturer         Manufacturer? @relation(fields: [manufacturerId], references: [id])
  sourceLinks          SourceLink[]
  versions             DataVersion[]

  @@index([eventId])
  @@index([riderId])
  @@index([motorcycleId])
  @@unique([eventId, riderId, className])
}

model Standing {
  id        String   @id @default(cuid())
  seasonId  String
  riderId   String
  className String?
  position  Int?
  points    Int
  wins      Int      @default(0)
  podiums   Int      @default(0)
  starts    Int      @default(0)
  dnfs      Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  season    Season   @relation(fields: [seasonId], references: [id])
  rider     Rider    @relation(fields: [riderId], references: [id])
  versions  DataVersion[]

  @@index([seasonId])
  @@index([riderId])
  @@unique([seasonId, riderId, className])
}

model ChampionshipRecord {
  id          String     @id @default(cuid())
  type        RecordType
  title       String
  description String?
  entityType  String?
  entityId    String?
  seasonId    String?
  className   String?
  valueNumber Decimal?
  valueText   String?
  calculatedAt DateTime  @default(now())
  metadata    Json?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([type])
  @@index([entityType, entityId])
  @@index([seasonId])
}

model HallOfFameEntry {
  id          String       @id @default(cuid())
  type        HallOfFameType
  title       String
  slug        String       @unique
  entityType  String?
  entityId    String?
  rank        Int?
  summary     String?
  recordId    String?
  metadata    Json?
  generatedAt DateTime     @default(now())
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([type])
  @@index([entityType, entityId])
}

model WeatherSnapshot {
  id                 String   @id @default(cuid())
  eventId            String
  temperatureC       Decimal?
  humidityPercent    Decimal?
  rainMm             Decimal?
  windSpeedKmh       Decimal?
  weatherDescription String?
  fetchedAt          DateTime @default(now())
  provider           String?
  rawPayload         Json?

  event              Event    @relation(fields: [eventId], references: [id])

  @@index([eventId])
  @@index([fetchedAt])
}

model MediaItem {
  id           String    @id @default(cuid())
  eventId      String?
  type         MediaType
  title        String?
  description  String?
  url          String
  thumbnailUrl String?
  photographer String?
  copyrightOwner String?
  license      String?
  source       String?
  provider     String?
  providerId   String?
  dateTaken    DateTime?
  publishedAt  DateTime?
  uploadedAt   DateTime  @default(now())
  tags         String[]  @default([])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  event        Event?     @relation(fields: [eventId], references: [id])
  entityLinks  MediaEntityLink[]
  sourceLinks  SourceLink[]

  @@index([eventId])
  @@index([provider, providerId])
}

model MediaEntityLink {
  id             String   @id @default(cuid())
  mediaItemId    String
  entityType     String
  entityId       String
  createdAt      DateTime @default(now())

  mediaItem      MediaItem @relation(fields: [mediaItemId], references: [id])

  @@index([mediaItemId])
  @@index([entityType, entityId])
}

model NewsArticle {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  summary     String?
  body        String?
  sourceUrl   String?
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  sourceLinks SourceLink[]
}

model DataSource {
  id          String            @id @default(cuid())
  name        String
  type        SourceType
  baseUrl     String?
  reliability SourceReliability @default(OFFICIAL)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  snapshots   SourceSnapshot[]
  links       SourceLink[]
}

model UserProfile {
  id          String   @id
  email       String?  @unique
  displayName String?
  role        UserRole @default(USER)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  favorites   UserFavorite[]
  notificationPreference NotificationPreference?
}

model UserFavorite {
  id          String       @id @default(cuid())
  userId      String
  entityType  FavoriteType
  entityId    String
  notify      Boolean      @default(true)
  createdAt   DateTime     @default(now())

  user        UserProfile  @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entityType, entityId])
  @@unique([userId, entityType, entityId])
}

model NotificationPreference {
  id                 String   @id @default(cuid())
  userId             String   @unique
  upcomingRaces      Boolean  @default(true)
  publishedResults   Boolean  @default(true)
  newVideos          Boolean  @default(true)
  newsArticles       Boolean  @default(true)
  riderUpdates       Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user               UserProfile @relation(fields: [userId], references: [id])

  @@index([userId])
}

model SlugRedirect {
  id          String   @id @default(cuid())
  entityType  String
  entityId    String
  oldSlug     String
  newSlug     String
  createdAt   DateTime @default(now())

  @@index([entityType, entityId])
  @@unique([entityType, oldSlug])
}

model SourceSnapshot {
  id           String   @id @default(cuid())
  dataSourceId String
  url          String
  contentHash  String
  rawContent   String?
  fetchedAt    DateTime @default(now())
  statusCode   Int?
  errorMessage String?

  dataSource   DataSource @relation(fields: [dataSourceId], references: [id])
  importRuns   ImportRun[]

  @@index([dataSourceId])
  @@index([contentHash])
}

model SourceLink {
  id           String   @id @default(cuid())
  dataSourceId String
  url          String
  entityType   String
  entityId     String
  note         String?
  createdAt    DateTime @default(now())

  dataSource   DataSource @relation(fields: [dataSourceId], references: [id])

  @@index([entityType, entityId])
  @@index([dataSourceId])
}

model ImportRun {
  id               String       @id @default(cuid())
  sourceSnapshotId String?
  jobName          String
  status           ImportStatus @default(PENDING)
  startedAt        DateTime     @default(now())
  finishedAt       DateTime?
  recordsFound     Int          @default(0)
  recordsCreated   Int          @default(0)
  recordsUpdated   Int          @default(0)
  recordsSkipped   Int          @default(0)
  errorMessage     String?
  metadata         Json?

  sourceSnapshot   SourceSnapshot? @relation(fields: [sourceSnapshotId], references: [id])
  changes          DataVersion[]
}

model DataVersion {
  id          String        @id @default(cuid())
  entityType  String
  entityId    String
  importRunId String?
  action      VersionAction
  previous    Json?
  next        Json?
  sourceUrl   String?
  createdBy   String?
  createdAt   DateTime      @default(now())

  importRun   ImportRun?     @relation(fields: [importRunId], references: [id])

  @@index([entityType, entityId])
  @@index([importRunId])
}

enum SeasonStatus {
  UPCOMING
  ACTIVE
  COMPLETED
}

enum EventStatus {
  SCHEDULED
  LIVE
  SUSPENDED
  COMPLETED
  CANCELLED
}

enum LiveStatus {
  UPCOMING
  LIVE
  SUSPENDED
  FINISHED
  CANCELLED
  UNKNOWN
}

enum EventTimelineType {
  REGISTRATION_OPEN
  ENTRY_LIST_PUBLISHED
  START_LIST_PUBLISHED
  STAGE_STARTED
  STAGE_FINISHED
  FINAL_CLASSIFICATION
  OFFICIAL_DOCUMENT
  GALLERY
  VIDEO
  NEWS
  POINTS_UPDATED
  OTHER
}

enum StageType {
  PROLOGUE
  DAY
  FINAL
  QUALIFYING
  OTHER
}

enum StrokeType {
  TWO_STROKE
  FOUR_STROKE
}

enum ResultStatus {
  FINISHED
  DNF
  DNS
  DSQ
  UNKNOWN
}

enum RecordType {
  MOST_WINS
  MOST_CHAMPIONSHIPS
  MOST_PODIUMS
  LONGEST_WINNING_STREAK
  YOUNGEST_WINNER
  OLDEST_WINNER
  MOST_STARTS
  MOST_DNFS
  CUSTOM
}

enum HallOfFameType {
  WORLD_CHAMPION
  LEGEND
  MOST_WINS
  MOST_PODIUMS
  MOST_CHAMPIONSHIPS
  HISTORIC_RECORD
  LEGENDARY_EVENT
  ICONIC_MOTORCYCLE
}

enum MediaType {
  IMAGE
  VIDEO
  YOUTUBE
  DOCUMENT
}

enum SourceType {
  OFFICIAL_WEBSITE
  TIMING_SYSTEM
  YOUTUBE
  NEWS
  MAPS
  WEATHER
  MANUAL
}

enum SourceReliability {
  OFFICIAL
  TRUSTED
  COMMUNITY
  UNKNOWN
}

enum UserRole {
  USER
  ANALYST
  EDITOR
  ADMIN
  OWNER
}

enum FavoriteType {
  RIDER
  EVENT
  TEAM
  MANUFACTURER
  MOTORCYCLE
  COUNTRY
}

enum ImportStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  NEEDS_REVIEW
}

enum VersionAction {
  CREATE
  UPDATE
  DELETE
  IMPORT
  MANUAL_EDIT
  ROLLBACK
  RECALCULATE
}
```

### Schema Notes

The schema intentionally includes source and versioning models from the beginning. Adding audit history later is expensive and usually creates gaps in data trust. This project should treat source tracking as a core feature, not an afterthought.

Country, Motorcycle, RaceStage, StageResult, RiderCareerSeason, MotorcycleSeasonStat, ManufacturerSeasonStat, ChampionshipRecord, HallOfFameEntry, EventTimelineItem, SlugRedirect, UserFavorite, and WeatherSnapshot should be part of the initial model because they directly affect filtering, historical accuracy, performance analytics, SEO stability, personalization, and future product depth.

The production implementation should keep `SourceLink`, `DataVersion`, `MediaEntityLink`, and `UserFavorite` generic with `entityType` and `entityId`, plus application-level validation. Prisma does not enforce polymorphic relations elegantly, and forcing many nullable relations into these tables would make the schema harder to maintain.

Timing should be stored in both machine-readable and display-preserving formats where possible. For example, `totalTimeMs` supports calculations, while `totalTimeText` preserves the official published format. `officialRawRow` should keep the original parsed row so the site can explain or repair imports years later.

### Career And History Strategy

Raw `Result` and `StageResult` records remain the source of truth. Summary tables such as `RiderCareerSeason`, `MotorcycleSeasonStat`, `ManufacturerSeasonStat`, `RiderComparisonSnapshot`, `ChampionshipRecord`, and `HallOfFameEntry` should be generated from raw results and recalculated after imports or approved manual edits.

This gives the platform both:

- Accurate historical source data.
- Fast profile, dashboard, comparison, and Hall of Fame pages.

Rider career pages should show season-by-season evolution, including team, manufacturer, motorcycle, championship position, points, wins, podiums, starts, DNFs, results, and calculated statistics.

Motorcycle pages should act as historical profiles, not specification sheets. Each motorcycle page should show riders who used it, seasons used, events entered, wins, podiums, DNFs, championships won, performance graphs, and historical statistics.

### Live Status Strategy

The system should be ready for future live timing without requiring a major schema redesign. `Event.liveStatus` and `RaceStage.status` should track whether an event or stage is upcoming, live, suspended, finished, cancelled, or unknown.

The first implementation does not need live timing. The schema simply reserves the right shape for future polling, official timing feeds, websocket updates, or incremental stage result ingestion.

### Event Timeline Strategy

Every event should be able to preserve its lifecycle through `EventTimelineItem` records. Timeline entries can represent registration opening, entry lists, start lists, prologues, race days, official PDFs, galleries, videos, news, final classification, and championship points updates.

Timeline items should link back to source records when possible, so users can understand when information was published and where it came from.

### Stable SEO Slug Strategy

Every public entity should have a permanent SEO-friendly slug:

- `/events/sea-to-sky-2026`
- `/riders/manuel-lettenbichler`
- `/teams/red-bull-ktm`
- `/manufacturers/ktm`
- `/motorcycles/ktm-300-exc-2026`
- `/countries/spain`

Once generated, slugs should never change automatically when display names are edited. If an editor intentionally changes a slug, the old slug should be written to `SlugRedirect` so existing links, search engine results, and shared URLs continue to work.

### Favorites And Notification Strategy

Authenticated users should eventually be able to follow riders, events, teams, manufacturers, motorcycles, and countries. Favorites should be stored generically so the feature can expand without creating new tables for each entity type.

Future notification triggers should include upcoming races, published results, new videos, news articles, rider updates, and followed-entity changes.

### Media Metadata Strategy

Media is part of the historical record and should preserve attribution. Every image, video, or document should keep rich metadata such as photographer, copyright owner, license, source, provider, event, rider, team, manufacturer, motorcycle, country, date taken, upload date, tags, and description.

`MediaEntityLink` should connect media assets to any relevant entity. This enables advanced media search, galleries by rider or event, and proper rights attribution.

## 4. Development Roadmap

### Phase 0 - Project Infrastructure

- Establish Git repository structure.
- Define branch strategy.
- Add ESLint.
- Add Prettier.
- Add Husky.
- Add Commitlint.
- Add GitHub Actions CI.
- Add Docker Compose for local PostgreSQL and Redis.
- Add `.env.example`.
- Add architecture documentation.
- Add coding standards.
- Add contribution guidelines.

### Phase 1 - Foundation

- Initialize Next.js, TypeScript, Tailwind CSS, Prisma, Playwright, and project quality tooling.
- Configure environment validation.
- Set up PostgreSQL, Supabase, and Redis/Upstash.
- Add base layout, responsive shell, dark mode, navigation, and SEO defaults.
- Create the initial Prisma schema and migrations.
- Seed one sample season, country, event, event timeline item, stage, rider, team, manufacturer, motorcycle, stage result, final result, standing, source, media item, and weather snapshot.
- Add permanent slug helper and redirect model support.

### Phase 2 - Core Public Data

- Build public pages for seasons, events, event timelines, stages, riders, rider careers, countries, motorcycles, motorcycle history, standings, and results.
- Add reusable timing tables with filtering, sorting, and mobile-friendly layouts.
- Add event detail pages with metadata, stage list, stage results, final classification, weather, location, media placeholders, and source links.
- Add rider profile pages with results history, motorcycle usage, stage performance, and season summaries.
- Add motorcycle profile pages with riders, seasons used, events entered, wins, podiums, DNFs, championships, and performance charts.

### Phase 3 - Admin And Data Trust

- Add Supabase Auth.
- Add admin dashboard.
- Add protected CRUD workflows for events, event timeline items, stages, riders, teams, manufacturers, motorcycles, results, standings, countries, media metadata, slug redirects, and records.
- Add source links and data version history views.
- Add manual review flow for imported changes.
- Add timing-table review screens that compare official source rows against stored rows.
- Add review workflows for generated rider career, motorcycle history, manufacturer stats, and Hall of Fame data.

### Phase 4 - Automation

- Add official source registry.
- Build ingestion jobs for official event calendar, stage timing, final classifications, and standings.
- Store raw source snapshots.
- Add diffing, validation, and pending review states.
- Add record recalculation jobs.
- Add rider career, motorcycle history, rider comparison, manufacturer dashboard, and Hall of Fame generation jobs.
- Add weather snapshot jobs.
- Add GitHub Actions and/or Vercel Cron schedules.
- Add monitoring and failure notifications.

### Phase 5 - Media, Maps, Charts, And AI

- Integrate YouTube API for official videos and highlights.
- Add event maps.
- Add weather visualizations.
- Add charts for points progression, stage gaps, wins, podiums, manufacturer stats, motorcycle stats, and historical trends.
- Add gallery and media pages with attribution, rights, tags, and entity-based search.
- Add rider-versus-rider comparison pages with wins, podiums, championships, DNFs, average finish, head-to-head results, common events, stage wins, time gap statistics, and performance charts.
- Add manufacturer dashboard pages with championships won, total wins, podiums, win percentage, riders, motorcycles, wins by season, wins by rider, and historical charts.
- Add isolated AI draft services for rider summaries, event summaries, previews, comparisons, Hall of Fame blurbs, and SEO drafts.

### Phase 6 - News, History, Records, And SEO Expansion

- Add news model and publishing flow.
- Add historical championship pages.
- Add championship records pages.
- Add generated Hall of Fame pages for world champions, legends, most wins, most podiums, most championships, historic records, legendary events, and iconic motorcycles.
- Add motorcycle and country statistics pages.
- Add structured metadata, Open Graph images, sitemap, robots, canonical URLs, and schema.org markup.
- Add permanent slug redirect handling and monitoring.
- Add internal linking strategy for seasons, riders, rider careers, events, stages, countries, manufacturers, motorcycles, records, Hall of Fame, and results.

### Phase 7 - Personalization And Notifications

- Add authenticated public user profiles.
- Add favorites for riders, events, teams, manufacturers, motorcycles, and countries.
- Add notification preferences.
- Add notification triggers for upcoming races, published results, new videos, news articles, and rider updates.
- Add email or in-app notification delivery after the core product is stable.

### Phase 8 - Production Hardening

- Add full Playwright coverage for critical user journeys.
- Add CI checks in GitHub Actions.
- Add import job tests and parser fixtures.
- Add timing-table fixture tests from official source examples.
- Add rate limits and admin audit protections.
- Add cache invalidation tests.
- Add slug redirect tests.
- Add generated-stat consistency tests.
- Add performance budgets.
- Add backup and restore strategy.
- Add analytics and error monitoring.

## 5. What To Build First And Why

The first implementation step should be project infrastructure and foundation, not the visual homepage.

Build first:

1. Git-friendly project foundation with documented branch and contribution standards.
2. Next.js project setup with TypeScript and Tailwind CSS.
3. ESLint, Prettier, Husky, Commitlint, and GitHub Actions CI.
4. Docker Compose for local PostgreSQL and Redis.
5. Prisma and PostgreSQL connection.
6. Environment variable validation and `.env.example`.
7. Initial database schema and migration.
8. Seed script with a tiny but realistic sample dataset including a country, motorcycle, event timeline item, event stage, stage result, final classification, weather snapshot, media item, and source link.
9. Base public layout, dark mode, navigation, and SEO defaults.
10. A simple read-only public event listing, event detail page, and one stage timing table.
11. One Playwright test proving the app loads and the stage result page works.

Why this comes first:

- The site is data-driven, so the database model must lead the build.
- Stage timing is central to the product, so the first vertical slice should prove stage and final classification data.
- Automation requires source tracking and version history from day one.
- Country and motorcycle normalization prevents messy historical data later.
- Permanent slugs and redirects prevent SEO breakage as names and entities evolve.
- Caching should be introduced early enough that data access patterns are designed intentionally.
- Public pages need real data relationships, not hardcoded mock content.
- A small vertical slice proves the stack works before expanding features.
- Playwright and CI should start early so regressions are caught while the project is still small.

## 6. Additional Production-Level Improvements

The following improvements should be considered part of the long-term architecture:

- **Canonical entity matching:** Imported riders, teams, events, and motorcycles need duplicate detection and merge workflows.
- **Data quality scoring:** Each imported record should carry confidence, source reliability, and review status where useful.
- **Import idempotency:** Running the same import twice should not create duplicate data.
- **Source priority rules:** Official timing should outrank secondary news and community sources.
- **Temporal modeling:** Team memberships, motorcycle usage, rules, and standings can change over time and should not be overwritten as if they are permanent.
- **Career-history integrity:** Rider career summaries should always be reproducible from raw results, stage results, standings, and memberships.
- **Motorcycle-history integrity:** Motorcycle statistics should be generated from actual usage in results and stage results, not manually maintained profile text.
- **Live timing readiness:** Event and stage status fields should support future live timing feeds, partial updates, and suspended stages.
- **Comparison consistency:** Rider comparison snapshots should be recalculated after imports so comparison pages stay fast and reproducible.
- **Manufacturer stat consistency:** Manufacturer dashboards should be generated from the same results pipeline as standings and records.
- **Hall of Fame generation:** Hall of Fame sections should be database-generated from champions, records, iconic motorcycles, and legendary events rather than manually curated as static pages.
- **Stable URL policy:** Slugs should be treated as permanent public identifiers, and slug changes should create redirects.
- **Materialized views or summary tables:** Heavy historical statistics may need precomputed tables later.
- **Search indexing:** Add a search layer later if PostgreSQL full-text search is not enough.
- **Localization readiness:** Country normalization and ISO codes prepare the site for future multi-language pages.
- **Media provenance:** Images, videos, and documents should keep source, rights, and provider metadata.
- **User personalization:** Favorites and notification preferences should be designed before launch even if the public feature ships later.
- **Backup strategy:** PostgreSQL backups, Supabase storage backups, and source snapshot retention policies should be documented.
- **Admin permissions:** Separate roles for owner, editor, data reviewer, and read-only analyst.
- **Observability:** Ingestion failures, parser changes, cache misses, and slow queries should be visible.
- **API design:** If public APIs are added later, version them from the beginning.
- **Accessibility:** Timing tables and charts must remain usable with keyboard navigation and screen readers.

## 7. Step 2 Recommendation After Approval

After this revised Step 1 plan is approved, Step 2 should be:

**Initialize the actual Next.js application and project foundation tooling.**

Step 2 should include only:

- Next.js App Router project setup.
- TypeScript.
- Tailwind CSS.
- ESLint and Prettier.
- Initial Husky and Commitlint configuration.
- Docker Compose for PostgreSQL and Redis.
- Prisma.
- `.env.example`.
- Initial app shell.
- Basic GitHub Actions CI.

It should not yet build all pages, admin tools, automation, AI services, charts, maps, or media workflows.
