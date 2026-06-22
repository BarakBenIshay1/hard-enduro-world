# Hard Enduro World System Architecture

This document explains how the current Hard Enduro World platform is organized, how each layer fits together, and how future trusted imports should move from official sources into the public website.

## 1. Public Website Layer

The public website is the reader-facing championship knowledge base. It is built with Next.js, React, TypeScript, Tailwind CSS, Prisma, and PostgreSQL-backed data.

Current public areas:

- Homepage: `/`
  - Premium entry point for the championship.
  - Presents the overall brand, featured event, standings preview, videos, gallery placeholders, statistics preview, sponsors, and newsletter.
- Events: `/events` and `/events/[slug]`
  - Lists championship events and shows event detail pages.
  - Includes stage navigation, timing tables, event statistics, winner history, and source-tracked calendar readiness.
- Riders: `/riders` and `/riders/[slug]`
  - Lists riders and shows rider profiles, career summaries, results history, season-by-season history, and future AI summary placeholders.
- Teams: `/teams` and `/teams/[slug]`
  - Shows team profiles, riders, manufacturer relationship, results structures, and team timelines.
- Manufacturers: `/manufacturers` and `/manufacturers/[slug]`
  - Shows manufacturer profiles, teams, riders, motorcycle previews, championship history, and milestones.
- Motorcycles: `/motorcycles` and `/motorcycles/[slug]`
  - Shows motorcycle technical profiles, specs, associated riders, manufacturer links, and performance placeholders.
- Standings: `/standings`
  - Displays championship standings with rider, team, manufacturer, motorcycle, points, wins, podiums, starts, and DNFs.
- Results: `/results`
  - Displays event and stage result rows, timing data, gaps, penalties, status, points, and links to events and riders.
- Statistics: `/statistics`
  - Provides calculated overview metrics and chart-ready sections from existing demo data.
- Records: `/records`
  - Shows record cards and leaderboards for wins, podiums, championships, starts, DNFs, manufacturers, motorcycles, and countries.
- History: `/history` and `/history/[year]`
  - Organizes seasons by year, champions, events, timelines, final standings, key statistics, and historical placeholders.
- Videos: `/videos`
  - Displays import-ready YouTube/video metadata from the safe connector foundation.

The public layer should stay fast, accessible, SEO-friendly, responsive, and dark-mode compatible. Expensive calculations should move toward cached or precomputed data as the database grows.

## 2. Admin Layer

The admin layer is the control room for data quality, future imports, review, and operational visibility. It is currently a foundation, not a full CRUD system.

Current admin areas:

- Dashboard: `/admin`
  - Overview cards for major entities, sources, pending reviews, failed imports, latest changes, and automation health.
- Sources: `/admin/sources` and `/admin/sources/[id]`
  - Shows official/manual/provider sources, source metadata, fetch history placeholders, raw snapshots, linked entities, and import run history.
- Audit Log: `/admin/audit`
  - Shows change history from `DataVersion`, including entity type, entity id/name, action, previous value, new value, source URL, changed by, changed at, and status.
- Review Queue: `/admin/review`
  - Structured placeholder for pending imports, needs-review items, approved, rejected, and failed changes.
  - Approval/rejection actions are not live yet.
- Jobs: `/admin/jobs` and `/admin/jobs/[id]`
  - Lists automation jobs and shows connector-specific job detail pages.
  - Current detailed connector pages include `youtube-videos` and `official-events`.
- Imports: `/admin/imports`
  - Shows import run history, status, source, counts, timing, and review status.
- Automation: `/admin/automation`
  - Shows automation overview, active jobs, paused jobs, failed jobs, successful runs, last run, next scheduled placeholder, and health status.

Future admin work should add authentication, role-based permissions, real create/edit forms, review approval mutations, source inspection, and audit history per entity.

## 3. Data Layer

The data layer is centered on PostgreSQL with Prisma as the typed access layer.

Main responsibilities:

- Prisma
  - Defines models, enums, relationships, and generated TypeScript client types.
  - Lives in `prisma/schema.prisma`.
- PostgreSQL
  - Stores championship entities, timing data, media/source metadata, admin review data, and version history.
- Seed data
  - Lives in `prisma/seed.ts`.
  - Provides realistic demo data for local development and UI validation.

Source tracking and audit models:

- `DataSource`
  - Represents official websites, YouTube channels, weather providers, manual admin sources, and future FIM/timing systems.
- `SourceSnapshot`
  - Stores a raw snapshot reference/payload from a source fetch before parsing.
- `ImportRun`
  - Represents one connector or automation execution.
  - Tracks status, records found, created, updated, skipped, failed, start time, finish time, and errors.
- `DataVersion`
  - Stores proposed or applied changes, previous values, next values, source URL, actor, timestamp, and import relationship.
- `SourceLink`
  - Connects internal entities to official/external source URLs or identifiers.

The principle is simple: official data should be traceable from public display back to the source, snapshot, import run, and audit/version record.

## 4. Automation Layer

The automation layer prepares the system for scheduled imports without allowing unreviewed data to overwrite trusted records.

Current structure:

- Job registry: `jobs/automation/registry.ts`
  - Defines job ids, names, descriptions, source types, frequency, risk level, review requirement, enabled state, and connector path.
- Runner: `jobs/automation/runner.ts`
  - Placeholder for future job execution.
- Snapshot: `jobs/automation/snapshot.ts`
  - Placeholder for saving fetched source data before parsing.
- Validation: `jobs/automation/validation.ts`
  - Placeholder for validating normalized data before diffs are created.
- Diff: `jobs/automation/diff.ts`
  - Creates diff preview structures for review.
- Types: `jobs/automation/types.ts`
  - Shared interfaces for jobs, diffs, review queue items, and automation status.

Automation should always favor traceability and review over speed. High-risk jobs such as results, standings, points, and records should require admin review before any public data changes.

## 5. Connectors

Connectors are isolated modules that know how to fetch, parse, and normalize one kind of external data. They should not directly update championship records.

Current connectors:

- YouTube connector: `jobs/connectors/youtube/`
  - Job id: `youtube-videos`
  - Purpose: prepare video metadata imports.
  - Current behavior: uses mock/demo data, creates import-ready previews, and requires review.
  - Safety: must not update results, standings, points, records, riders, teams, manufacturers, or motorcycles.
- Official Events connector: `jobs/connectors/events/`
  - Job id: `official-events`
  - Purpose: prepare official calendar metadata imports.
  - Current behavior: uses mock/demo events, normalizes calendar fields, creates diff/review previews.
  - Safety: limited to event name, season, date, country, location, status, and official URL.

Future connectors:

- Future Results connector
  - Will import final classifications only after strict validation and review.
- Future Weather connector
  - Will import weather snapshots for events and stages.
- Future FIM connector
  - Will connect official FIM/championship data sources to source-tracked import workflows.
- Future timing connector
  - Will import stage timing tables while preserving every official row, gap, penalty, and status.

## 6. Trusted Import Flow

Future production imports should follow this path:

Official source
-> fetch
-> snapshot
-> parse
-> normalize
-> validate
-> diff
-> admin review
-> approval
-> database update
-> audit log
-> public website update

Nothing from an external source should bypass this flow. Even low-risk data should keep source and snapshot history. High-risk data should require approval before public display changes.

## 7. Current Local Development Architecture

```text
Developer Mac
  |
  | pnpm run dev
  v
Next.js App (localhost)
  |
  | Prisma Client
  v
PostgreSQL (Docker Compose)
  |
  +-- Seed data
  +-- Public pages
  +-- Admin pages
  +-- Source tracking records

Redis (Docker Compose)
  |
  +-- Future cache layer
  +-- Future rate/job state support
```

Local entry points:

- Public site: `http://localhost:3000`
- Admin dashboard: `http://localhost:3000/admin`
- Events connector detail: `http://localhost:3000/admin/jobs/official-events`
- YouTube connector detail: `http://localhost:3000/admin/jobs/youtube-videos`
- Videos page: `http://localhost:3000/videos`

## 8. Future Production Architecture

```text
Visitor
  |
  v
Vercel Edge / CDN
  |
  v
Next.js Application
  |
  +--> Redis / Upstash Cache
  |
  +--> Prisma
        |
        v
      PostgreSQL / Supabase

GitHub Actions / Vercel Cron
  |
  v
Automation Jobs
  |
  v
Connectors
  |
  v
Source Snapshots + Import Runs + Review Queue
```

Production goals:

- Public pages should use caching for high-traffic reads.
- Admin pages should be protected by Supabase Auth or equivalent.
- Cron jobs should create snapshots and review items, not silently mutate critical data.
- Every approved update should leave an audit trail.

## 9. Data Import Flow

```text
Official Source
  |
  | fetch
  v
Raw Payload
  |
  | save
  v
SourceSnapshot
  |
  | parse
  v
Parsed Rows
  |
  | normalize
  v
Typed Domain Payloads
  |
  | validate
  v
Validated Payloads
  |
  | compare with database
  v
Diff Preview
  |
  | attach to run
  v
ImportRun + DataVersion placeholders
```

At this stage, nothing should be published yet unless the job is explicitly allowed to auto-publish. Championship-critical data should not auto-publish.

## 10. Admin Review Flow

```text
Pending Review Item
  |
  v
Admin Review Queue
  |
  +--> Inspect source
  +--> Inspect snapshot
  +--> Inspect previous value
  +--> Inspect proposed value
  |
  +--> Reject
  |      |
  |      v
  |    Mark rejected + audit note
  |
  +--> Approve
         |
         v
       Apply database update
         |
         v
       Create DataVersion audit row
         |
         v
       Public page reads updated data
```

Future approval should be role-protected. Owners and admins can approve high-risk data; editors/reviewers may prepare or review changes depending on permissions.

## 11. Practical Development Notes

Common local workflow:

- Start Docker services for PostgreSQL and Redis.
- Run Prisma migration/seed when schema or demo data changes.
- Start the Next.js development server.
- Use public pages to verify user-facing behavior.
- Use admin pages to inspect sources, jobs, imports, review queue, and audit history.

Where to look:

- Public routes: `app/`
- Reusable UI components: `components/`
- Database queries: `db/`
- Prisma schema and seed: `prisma/`
- Automation foundation: `jobs/automation/`
- Connectors: `jobs/connectors/`
- Architecture docs: `docs/`

The platform is being built in controlled steps. Each step should preserve existing public modules and add only the approved layer or vertical slice.

## 12. Production Deployment Foundation

The future production target is Vercel + Supabase + Upstash:

- Vercel hosts the Next.js application, public pages, and protected admin surfaces.
- Supabase PostgreSQL stores the Prisma-managed data model.
- Upstash Redis provides the future production cache and lightweight job state support.
- GitHub Actions and/or Vercel Cron can trigger future dry-run automation jobs.

Environment separation:

- Local: Docker PostgreSQL + Docker Redis + local `.env`.
- Staging: Vercel preview/staging + Supabase staging + Upstash staging.
- Production: Vercel production + Supabase production + Upstash production.

Deployment is not automated yet. Before launch, admin authentication, production backups, migration review, cron protection, and secret handling must be completed.

Related docs:

- `docs/production-checklist.md`
- `docs/deployment-guide.md`
