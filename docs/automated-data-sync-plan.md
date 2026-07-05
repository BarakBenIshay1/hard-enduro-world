# Automated Official Data Sync Plan

This plan defines how Hard Enduro World should move from manually curated
verified data toward automatic official data sync without sacrificing historical
accuracy.

This sprint is documentation only. No connector in this plan should publish data
directly, write championship facts to the database, or bypass admin review.

For the full data-system contract, entity relationships, source hierarchy,
verification rules, versioning strategy, and failure behavior, see
`docs/architecture/master-data-architecture.md`.

## Goals

- Use official or trusted championship/event sources only.
- Keep every imported fact source-tracked and review-first.
- Produce dry-run reports before any database mutation exists.
- Protect public pages from unverified results, standings, statistics, records,
  rider facts, images, and media.
- Prioritize a small number of high-value connectors before expanding the system.

## Current Connection Architecture

The current project already has the main safety layers needed for official data
sync:

```text
Official source registry
  -> source adapter registry/factory
  -> source-specific connector
  -> intake package
  -> normalize
  -> validate
  -> diff/review package
  -> admin review
  -> future approval mutation
  -> database update
  -> audit log
  -> public website
```

Current code locations:

- Source allow-list: `data/verified/source-registry.ts`
- Adapter architecture: `data/verified/adapters/`
- HTML adapter foundation: `data/verified/adapters/html/`
- Verified pipeline: `data/verified/pipeline/`
- Verified event/result/rider facts: `data/verified/events.ts`,
  `data/verified/results.ts`, `data/verified/riders.ts`
- Automation registry and runner foundation: `jobs/automation/`
- Existing connector foundations: `jobs/connectors/events/`,
  `jobs/connectors/results/`, `jobs/connectors/youtube/`
- Admin source/audit data access: `db/sources.ts`, `db/audit.ts`,
  `db/automation.ts`

Source tracking is designed around:

- `DataSource`
- `SourceSnapshot`
- `ImportRun`
- `SourceLink`
- `DataVersion`

The important rule is that source snapshots and review packages may be prepared
automatically, but public facts should not change until a reviewer approves the
change.

## Existing Placeholders

### Official Source Registry

The source registry already includes approved/trusted entries for:

- FIM official sources
- Red Bull Motorsports
- Red Bull Erzbergrodeo official sources
- Red Bull Romaniacs official sources
- Sea to Sky official sources
- US Hard Enduro official sources
- Official event PDFs
- Official timing CSV exports
- Trusted YouTube/media channels

The registry also defines allowed data types and trust levels. This already
blocks media-only sources from creating official results or timing rows.

### Adapter Layer

The adapter architecture exists and is intentionally source-isolated:

- `base.ts` defines the official source adapter interface.
- `registry.ts` maps registered sources to adapter placeholders.
- `factory.ts` creates adapters only for registered sources.
- `html/` defines a future official HTML interpretation layer.

Current adapters are foundations, not production parsers.

### Verified Pipeline

The verified pipeline exists:

- `intake.ts` defines incoming source-specific packages.
- `normalize.ts` maps intake into verified event/rider/result structures.
- `validate.ts` checks source references, duplicate results, future seasons,
  allowed source/data-type rules, and review requirements.
- `review.ts` creates review-ready items.
- `summary.ts` combines normalization, validation, review, and coverage summary.
- `run.ts` provides an offline in-memory developer runner.

### Existing Connectors

The current connector folders are useful foundations:

- `jobs/connectors/events/`
  - Generic official calendar connector.
  - Supports config, source fetcher, parser, normalizer, diff preview, review
    items, and source-tracking previews.
- `jobs/connectors/results/`
  - Generic official results connector.
  - Supports HTML, JSON, CSV, and PDF-metadata payload detection.
  - Review-only by design.
- `jobs/connectors/youtube/`
  - Video metadata connector foundation.
  - Should remain media-only and review-first.

## Missing Connectors

The next production gap is not the generic connector shell. It is
source-specific reliability.

Missing pieces:

- A source-specific FIM / Hard Enduro World Championship calendar connector.
- A source-specific Red Bull Erzbergrodeo results connector.
- A KTM official rider profile connector for the Manuel Lettenbichler pilot.
- Official PDF parsing beyond metadata capture.
- Official timing CSV import with row-level validation.
- A durable dry-run change report format for admins/developers.
- Approval mutations that convert reviewed changes into database updates.
- Production cron scheduling with lock/rate-limit protection.

## Recommended Implementation Order

1. FIM / Hard Enduro World Championship Calendar Connector
   - Lowest-risk official fact flow.
   - Establishes dry-run comparison and change reports for event metadata.
   - Helps keep the current season calendar accurate without touching results.

2. Red Bull Erzbergrodeo Official Results Connector
   - Highest immediate value for the gold-standard Erzbergrodeo event page.
   - Must remain review-only.
   - Should focus on final classification, timing references, and stage/main race
     result tables.

3. KTM Official Rider Profile Connector
   - Supports the Manuel Lettenbichler rider pilot.
   - Should verify identity, team, manufacturer, motorcycle, official biography
     facts, and approved profile media metadata.

4. Official PDF and CSV Timing Adapters
   - Needed for complete historical classifications and stage timing tables.
   - Should be added after the first event/result connectors prove the review
     workflow.

5. Approval and Audit Persistence
   - Convert review packages into controlled database writes.
   - Must write `DataVersion`, source links, and audit records for every approved
     change.

## Priority Connector Scope

### 1. FIM / Hard Enduro World Championship Calendar

Purpose:

- Current season calendar.
- Event list.
- Event dates.
- Event country/location.
- Event official URL.
- Event status: Coming Soon, Live Now, Race Completed.

Collect:

- Event name.
- Season year.
- Start date.
- End date.
- Country.
- Location/venue when official.
- Status when official or derivable from official dates.
- Official source URL.
- Source publication/fetch timestamp.

Can auto-update safely now:

- Nothing public.
- The first implementation should only generate a dry-run change report.

Requires manual review:

- New events.
- Date changes.
- Country/location changes.
- Status changes.
- Cancelled/postponed/suspended labels.
- Official URL changes.

### 2. Red Bull Erzbergrodeo Official Results

Purpose:

- Final classification.
- Timing.
- Live timing reference.
- Prologue/main race results.
- Finishers, DNF, DNS, DSQ when available.

Collect:

- Event slug/source event id.
- Classification type: overall, prologue, main race, stage/day.
- Rider name and stable rider match.
- Country.
- Team, manufacturer, motorcycle when officially present.
- Position.
- Time.
- Gap to leader.
- Gap to previous.
- Penalties.
- Points only if official and relevant.
- Status: Finished, DNF, DNS, DSQ.
- Official result URL, PDF URL, timing export URL, or live timing reference.

Can auto-update safely now:

- Nothing public.
- Source snapshots and review previews only.

Requires manual review:

- Every result row.
- Every timing value.
- Every rider match.
- Every DNF/DNS/DSQ status.
- Every correction to an existing result.
- Any derived standings/statistics/records impact.

### 3. KTM Official Rider Profile

Purpose:

- Manuel Lettenbichler rider pilot.
- Rider identity.
- Team.
- Manufacturer.
- Motorcycle.
- Official biography facts.

Collect:

- Official rider name.
- Country/nationality.
- Current team.
- Manufacturer.
- Motorcycle model only when official.
- Rider number only when official.
- Short biography facts.
- Official profile URL.
- Official image metadata if licensing/usage is clear.

Can auto-update safely now:

- Nothing public.
- Review package only.

Requires manual review:

- Rider biography copy.
- Team/manufacturer/motorcycle relationships.
- Profile image rights.
- Career achievements.
- Any result-derived claim.

## What Can Auto-Update Safely

At the current maturity level, no public championship fact should auto-update.

Safe automatic work is limited to:

- Fetch attempts in dry-run mode.
- Source snapshot previews.
- Import run previews.
- Normalized candidate records.
- Validation warnings/errors.
- Diff/change reports.
- Review queue previews.

Future low-risk auto-persistence may be considered for raw `SourceSnapshot` and
`ImportRun` records only, but that should not publish or overwrite public facts.

## What Must Require Manual Review

Manual review is required for:

- All results and timing data.
- All stage result rows.
- All standings, statistics, and records changes.
- Event date/country/location/status changes.
- Rider identity and biography fields.
- Team, manufacturer, and motorcycle relationships.
- Any media asset before public use.
- Any source with low confidence or ambiguous identity matching.
- Any 2027-or-later data unless it is official future calendar metadata.

## Risks

- Official page layouts can change without warning.
- Event names can vary by sponsor, year, or language.
- Rider names can have spelling/diacritic differences.
- Dates may be published in local time without timezone context.
- Live timing can be provisional and later corrected.
- PDF classifications may contain tables that are hard to parse reliably.
- CSV/timing exports can change column names.
- Media-only sources can accidentally be treated as result sources.
- Images and biography text can create licensing/copyright problems.
- A connector bug could create duplicate event or rider matches.
- Results could accidentally trigger standings/statistics/records recalculation
  before review.

## Guardrails

- Use only source ids from `data/verified/source-registry.ts`.
- Enforce `allowedDataTypes` for every source-derived fact.
- Keep unknown fields as `null`; never infer missing timing, points, or podiums.
- Keep all connector output review-required.
- Run connectors in dry-run mode before adding persistence.
- Compare by stable slugs and source identifiers, not display text alone.
- Preserve raw source snapshots so parsing can be retried.
- Store confidence and notes with every proposed change.
- Block media-only sources from creating official results.
- Never publish future winners, podiums, standings, points, timing, or records.
- Do not run derived recalculations from unapproved imports.

## Proposed Cron Strategy

Cron should be introduced only after the dry-run connector produces reliable
change reports.

Recommended initial cadence:

- FIM calendar connector:
  - Daily during the active season.
  - Weekly in the off-season.
  - Additional manual dry-run before and after event weekends.
- Erzbergrodeo results connector:
  - Manual dry-run only at first.
  - Later: limited dry-run polling during the event window.
  - No automatic publish.
- KTM rider profile connector:
  - Manual dry-run only.
  - Later: monthly profile check during the season.
- YouTube/media connector:
  - Daily or weekly, review-first.

Cron guardrails:

- One run per connector at a time.
- Store or report run id, source URL, timestamp, and content hash.
- Back off after source errors.
- Respect official source rate limits.
- Do not schedule high-risk result imports without admin visibility.

## Proposed Review Workflow

```text
Scheduled/manual dry run
  -> fetch official source
  -> create source snapshot preview
  -> parse source-specific records
  -> normalize into verified data structures
  -> validate source/data-type/rider/event rules
  -> compare with current database and verified data
  -> produce change report
  -> create review-ready items
  -> admin reviews each change
  -> approval mutation later writes database changes
  -> DataVersion/audit log records the approved change
  -> derived calculations run in preview mode
  -> public website updates only after approval
```

Review states should remain:

- Pending.
- Needs manual verification.
- Approved.
- Rejected.
- Failed.

High-risk changes should show exact before/after values and source links.

## FIM Calendar Connector Technical Plan

The FIM Calendar Connector should be the first official sync implementation.

### Purpose

Create a dry-run official calendar comparison tool for the current season. It
should identify event metadata differences without writing to the database or
publishing public changes.

### Proposed Location

Either:

- `jobs/connectors/fim-calendar/`

Or a source-specific submodule under:

- `jobs/connectors/events/fim-calendar/`

The dedicated folder is cleaner if more FIM connectors will follow.

### Configuration

Environment variables:

- `FIM_CALENDAR_URL`
- `FIM_CALENDAR_DRY_RUN=true`

The connector should fail closed when no official URL is configured.

### Dry-Run Inputs

The connector should support:

- Official FIM/championship HTML calendar pages.
- Official JSON calendar payloads if available.
- Official PDF calendar metadata only, until PDF parsing is added.
- Local in-memory sample input for developer tests.

No public data should change from these inputs.

### Pipeline

```text
FIM official source
  -> fetch or local dry-run sample
  -> source snapshot preview
  -> FIM calendar parser
  -> normalized calendar event facts
  -> validation
  -> database/verified-data comparison
  -> change report
  -> review-ready items
```

### Normalized Event Fields

Each normalized event candidate should include:

- `sourceEventId`
- `seasonYear`
- `name`
- `slugCandidate`
- `country`
- `countryCode`
- `location`
- `venue`
- `startDate`
- `endDate`
- `status`
- `officialUrl`
- `sourceId`
- `confidence`
- `notes`

Unknown fields must remain `null`.

### Validation Rules

The first connector should validate:

- Source id exists and is `fim-official` or another approved official calendar
  source.
- Source is allowed to provide `events`.
- Season is within current approved scope or official future calendar metadata.
- Event name exists.
- Start date exists.
- Country exists when official source provides it.
- Duplicate source event ids are blocked.
- Duplicate slug candidates are warnings or errors depending on confidence.
- Status maps only to Coming Soon, Live Now, Race Completed, Suspended, or
  Cancelled.
- No winner, podium, timing, points, standings, statistics, or records are
  produced.

### Comparison Report

The dry-run report should classify:

- New event found.
- Existing event unchanged.
- Date changed.
- Country changed.
- Location changed.
- Status changed.
- Official URL changed.
- Event missing from source but present in database.
- Ambiguous match requiring manual review.

Each report row should include:

- Existing value.
- Proposed value.
- Source URL.
- Confidence.
- Severity.
- Review recommendation.

### Output

The first version should return an in-memory object and optionally render a
developer-readable report through the admin/connector preview later.

It must not:

- Create or update `Event`.
- Create or update `Season`.
- Publish status changes.
- Touch results, standings, statistics, records, riders, teams, manufacturers,
  or motorcycles.

### Acceptance Criteria

- A dry-run function can be executed without database writes.
- The connector uses only registered official sources.
- The connector produces normalized event candidates.
- The connector compares candidates with current database/verified data.
- The connector returns a clear change report.
- Every proposed change is review-required.
- Validation catches unsupported sources, duplicate events, missing dates, and
  future-season misuse.

## Next Approval Gate

After this plan is approved, the next implementation should be the FIM Calendar
Connector in dry-run mode only. It should not add live cron, admin approval
mutations, automatic publishing, or result imports.
