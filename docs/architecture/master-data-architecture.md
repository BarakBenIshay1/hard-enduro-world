# Master Data Architecture

This document defines the complete data architecture for Hard Enduro World. It is
the long-term contract for how the platform stores, verifies, updates, reviews,
and publishes championship knowledge.

The system is designed to grow into a large automated Hard Enduro knowledge base
without publishing fictional, inferred, or unsourced historical facts.

## 1. Operating Principles

- Less but better: prefer incomplete verified data over complete fictional data.
- Official first: official timing, event, championship, team, manufacturer, and
  rider sources outrank unofficial sources.
- Review-first: automation may detect changes, but public facts require review.
- One source of truth: each public fact should map to one canonical internal
  record with source links and version history.
- Unknown stays unknown: missing values remain `null` until verified.
- No inferred winners, podiums, timing rows, points, biographies, or media.
- No duplicate public facts: if two sources describe the same fact, reconcile
  them through source hierarchy and review instead of displaying both.
- Public pages must not expose internal pipeline language.
- The public website must keep working even when automation fails.

## 2. Core Entities

### Rider

Represents a real rider profile. Rider records may exist before full career data
is verified, but unverified statistics must remain empty or zero.

Key responsibilities:

- Identity and stable slug.
- Nationality/country.
- Current team, manufacturer, and motorcycle when verified.
- Biography only from official or trusted profile sources.
- Career facts derived from approved results and standings.
- Links to results, events, team, manufacturer, and motorcycle.

### Event

Represents one event edition, usually tied to a season year.

Key responsibilities:

- Event name, stable slug, country, location, dates, status, overview, terrain,
  elevation, organizer, official links, and verified facts.
- Event dashboard sections: hero, results, route maps/course maps, overview, and
  history.
- Relationship to stages, results, media, documents, course maps, and sources.

### Stage

Represents a specific race segment, day, prologue, qualification, final, or any
custom official event section.

Key responsibilities:

- Event relationship.
- Stage name and order.
- Stage date/status when verified.
- Distance, terrain, elevation gain, and route metadata when verified.
- Relationship to stage results and course maps.

Stages must be dynamic. The system must never assume fixed labels such as
Prologue, Day 1, Day 2, or Final.

### Result

Represents official classification rows.

Key responsibilities:

- Overall and stage classification.
- Rider, event, stage, team, manufacturer, and motorcycle relationships.
- Position, class position, time, gaps, penalties, points, checkpoints, average
  speed, and status.
- Status values such as Finished, DNF, DNS, and DSQ.
- Source links and version history.

Results are high-risk and must never auto-publish.

### Team

Represents a racing organization such as a factory team, privateer team,
academy, or independent structure.

Key responsibilities:

- Team identity, slug, country/base, type, and history.
- Rider roster relationships.
- Manufacturer partnership by season when verified.
- Team achievements derived from approved results.

### Manufacturer

Represents a motorcycle brand.

Key responsibilities:

- Brand identity, slug, country, history, and factory program context.
- Motorcycle model relationships.
- Rider and team relationships.
- Manufacturer achievements derived from approved results.

### Motorcycle

Represents a first-class motorcycle model/year/profile.

Key responsibilities:

- Manufacturer relationship.
- Model name, year, engine, stroke type, weight, suspension, horsepower, torque,
  fuel capacity, and technical description when verified.
- Rider/team usage relationships.
- Performance metrics derived from approved results.

### Season

Represents a championship year.

Key responsibilities:

- Season year and status.
- Events in that season.
- Standings and derived season summaries.
- Champion, runner-up, and history only when verified.

Current verified scope is 2022-2026. Future seasons may appear only as official
calendar metadata.

### Standings

Represents championship rankings derived from approved results and points rules.

Key responsibilities:

- Rider standings.
- Future manufacturer/team standings when supported.
- Points, wins, podiums, starts, DNFs, and ranking position.
- Calculation source and version history.

Standings are derived data and should not be imported as the primary source of
truth unless they are used as an official validation reference.

### Media

Represents approved images, videos, galleries, and related media metadata.

Key responsibilities:

- Provider, source, copyright owner, license, attribution, upload date, date
  taken, tags, and relationships to event/rider/team/manufacturer/motorcycle.
- Media-only sources cannot create official results or timing facts.

### Documents

Represents official PDFs, regulations, entry lists, final classifications, timing
exports, bulletins, and other official files.

Key responsibilities:

- Document title, type, URL/path, source, publication date, and related entities.
- Official documents can support event metadata, results, timing, and standings
  only when parsed/reviewed.

### Course Maps

Represents verified route/map material for an event stage.

Key responsibilities:

- Event/stage relationship.
- Official map image, PDF map, GPX/GPS file, route metadata, and source
  attribution when verified.
- Public display should hide unverified map details and avoid fake route images.

### Sources

Represents trusted origins for data.

Key responsibilities:

- Source identity, type, URL/channel, allowed data types, trust level,
  reliability, review requirement, and notes.
- Source entries live in the official source registry and in database source
  tracking when persisted.

### Import Runs

Represents one connector execution.

Key responsibilities:

- Job id/name, source, status, start/end time, records found, created, updated,
  skipped, failed, and error details.
- Import runs should exist even when no public data changes.

### Data Versions

Represents proposed or approved changes to facts.

Key responsibilities:

- Entity type/id, action, previous value, new value, source, actor, import run,
  status, and timestamps.
- Enables rollback and audit history.

### Audit Logs

Represents human-readable accountability for approved or rejected changes.

Key responsibilities:

- Who changed what, when, why, from which source, and through which review item.

### Review Items

Represents proposed changes awaiting approval.

Key responsibilities:

- Proposed payload, diff, validation issues, confidence, source links, reviewer,
  decision, and notes.

## 3. Relationships

### Rider Relationships

- Rider to Team:
  - A rider may have a current team and many historical team relationships by
    season.
- Rider to Manufacturer:
  - A rider may be associated with a current manufacturer and historical
    manufacturer relationships by season.
- Rider to Motorcycle:
  - A rider may be linked to the motorcycle model used in a season or event.
- Rider to Event:
  - A rider participates in events through result rows, start lists, or verified
    entry lists.
- Rider to Result:
  - A rider can have many overall and stage result rows.

### Event Relationships

- Event to Stage:
  - An event has zero or many dynamic stages/days.
- Stage to Result:
  - Stage results belong to exactly one stage and one event.
- Event to Course Maps:
  - Course maps attach to an event and ideally to a specific stage.
- Event to Media:
  - Media can attach to an event, stage, rider, team, manufacturer, or
    motorcycle.
- Event to Documents:
  - Documents attach to event-level or stage-level official materials.

### Team Relationships

- Team to Riders:
  - Teams have current and historical rider rosters.
- Team to Manufacturer:
  - Teams can have current and historical manufacturer partnerships.

### Manufacturer Relationships

- Manufacturer to Motorcycles:
  - A manufacturer owns many motorcycle model profiles.
- Manufacturer to Riders:
  - Riders connect to manufacturers directly or through team/motorcycle usage.

### Season Relationships

- Season to Events:
  - A season contains ordered event rounds or official calendar entries.
- Season to Standings:
  - Standings belong to a season and are derived from approved results and points
    rules.

## 4. Source Hierarchy

Source trust is evaluated by data type. A source that is strong for media may be
invalid for results.

Recommended hierarchy:

1. Official timing/export
   - Highest authority for timing rows, positions, gaps, penalties, finish
     status, checkpoints, and stage classifications.
2. Official event PDF
   - High authority for final classifications, regulations, entry lists, and
     official bulletins.
3. Official event website
   - High authority for event metadata, schedules, route descriptions, documents,
     and event-specific result pages.
4. FIM / championship source
   - High authority for season calendar, championship standings, official
     championship status, and series-level documents.
5. Official team/manufacturer source
   - High authority for roster, program, motorcycle, and rider relationship
     facts.
6. Official rider source
   - High authority for identity, biography, profile links, and career context,
     but not standalone race classifications.
7. Trusted media
   - Valid for media references and context only.
   - Cannot create official results, timing, standings, or records.
8. Social media
   - Discovery or media context only unless it is an official account and the
     fact is low-risk.
   - Should not override official timing, PDFs, or championship data.

### Conflict Rules

- Official timing/export beats event article copy for result rows.
- Official final classification PDF beats provisional/live timing.
- FIM/championship calendar beats copied calendar text on secondary pages.
- Event official source beats media recaps for event-specific details.
- Team/manufacturer/rider official sources can confirm profile relationships, but
  not race classifications unless they link to official results.
- Manual admin correction requires an audit note and source explanation.
- If two high-trust sources conflict, hold the fact for review and show the
  current approved value until resolved.
- Never merge conflicting values silently.

## 5. Entity Resolution

Entity resolution matches incoming source data to canonical internal records.

### Rider Names

Examples:

- `Manuel Lettenbichler`
- `M. Lettenbichler`
- `Mani Lettenbichler`

Rules:

- Prefer official rider id if present.
- Otherwise match by normalized full name, country, and known aliases.
- Initial-based matches require manual review.
- Do not create a new rider when an existing canonical rider is likely.
- Do not merge riders automatically when confidence is low.

### Team Names

Examples:

- `Red Bull KTM`
- `Red Bull KTM Factory Racing`
- `KTM Factory Racing`

Rules:

- Prefer official team id/source URL if present.
- Normalize sponsor prefixes, casing, punctuation, and common abbreviations.
- Keep yearly sponsor variations as aliases when the organization is the same.
- Create a new team only when the source confirms a distinct organization.

### Event Names

Sponsor names may change by year.

Rules:

- Canonical event edition slug should include event identity and year.
- Store display names separately from permanent slugs.
- Match by event family, year, country, location, and official URL.
- Keep sponsor/title variations as aliases or display names, not new unrelated
  event families.

### Motorcycle Models

Examples:

- `KTM 300 EXC`
- `KTM 300 EXC 2026`
- `KTM EXC 300`
- `300 EXC`

Rules:

- Match by manufacturer, model family, displacement, year, and official model
  name.
- If model year is unknown, do not infer it.
- Do not merge factory prototype/setup names into production model profiles
  without source confirmation.

## 6. Verification Rules

### Auto-Import Allowed

Automation may automatically:

- Fetch configured official sources in dry-run mode.
- Create source snapshot previews or future source snapshot records.
- Create import run logs.
- Normalize candidate records.
- Validate source/data-type rules.
- Produce diffs and review queue items.
- Detect changes and generate reports.

### Review Required

Review is required for:

- Event calendar changes.
- Results and timing.
- Standings.
- Rider profile facts.
- Team changes.
- Manufacturer relationships.
- Motorcycle details.
- Course maps.
- Media/images.
- Documents used as source of truth.
- Statistics and records.

### Never Publish Automatically

Never auto-publish:

- Winners.
- Podiums.
- Timing rows.
- Points.
- Standings.
- Statistics.
- Records.
- Biographies.
- Images/media.
- Course maps.
- Future event results.

### Unknown Values

- Unknown values remain `null`.
- Public UI should hide unknown fields or show compact user-facing placeholders.
- Internal uncertainty should not leak into public copy.

## 7. Automation Update Flow

```text
Official source
  -> connector
  -> source snapshot
  -> normalization
  -> validation
  -> entity resolution
  -> diff
  -> review queue
  -> approval
  -> database update
  -> audit log
  -> website update
```

Step responsibilities:

- Connector:
  - Knows how to fetch or read one source type.
  - Does not publish.
- Source snapshot:
  - Preserves raw source material or metadata before parsing.
- Normalization:
  - Converts source-specific fields into platform types.
- Validation:
  - Checks required source ids, allowed data types, duplicates, future-season
    rules, and missing identities.
- Entity resolution:
  - Matches incoming records to canonical entities.
- Diff:
  - Compares current approved data with proposed values.
- Review queue:
  - Presents what would be added, changed, or rejected.
- Approval:
  - Human decision point for every public fact.
- Database update:
  - Applies approved changes only.
- Audit log:
  - Records the source, actor, timestamp, previous value, and new value.
- Website update:
  - Public pages render approved data only.

## 8. Cron Strategy

### Daily Calendar Checks

- Run FIM/championship calendar dry-runs daily during active season.
- Run weekly during off-season.
- Produce change reports for review.

### Event-Week Checks

- Increase calendar/status checks during event week.
- Check official event pages for documents and schedule updates.
- Keep all detected changes review-required.

### Live-Event Dry Runs

- Allow limited live-event dry-runs for official results/timing sources.
- Do not publish live timing automatically.
- Treat live data as provisional until final official classification is reviewed.

### Rider Profile Checks

- Run manually at first.
- Later run monthly or before season launch for official rider/team/manufacturer
  profile sources.

### Media Checks

- YouTube/media checks can run daily or weekly.
- Media still requires review before public display.

### Connector Locks

- Only one run per connector/source should execute at a time.
- Use run ids and lock timestamps to prevent overlapping imports.

### Retry and Backoff

- Retry transient failures with exponential backoff.
- Stop after a configured retry limit.
- Preserve failure logs in import runs.

### Failure Handling

- Failed automation must not break public pages.
- Failed runs should create admin-visible warnings.
- Repeated failures should pause the connector and require manual inspection.

## 9. Connector Coverage

Planned connector coverage:

- FIM calendar connector
  - Season calendar, event dates, event status, official URLs.
- Hard Enduro official calendar connector
  - Championship calendar metadata and season-level validation.
- Red Bull Erzbergrodeo results connector
  - Final classification, prologue/main race, timing references, finishers,
    DNF/DNS/DSQ.
- Romaniacs results connector
  - Event-specific multi-day stage results and final classification.
- Sea to Sky results connector
  - Beach/forest/mountain race structures and final classification.
- Official PDF connector
  - Metadata first, later table extraction with review.
- Official timing CSV connector
  - Row-level timing import with strict validation.
- KTM rider profile connector
  - Manuel Lettenbichler pilot profile, team, manufacturer, motorcycle, official
    bio facts.
- Manufacturer profile connectors
  - Official brand, model, and factory program facts.
- YouTube/media connector
  - Official/trusted video metadata and source-aware media references.

## 10. Automatic Operations

Safe automatic operations:

- Dry-run reports.
- Source snapshot creation or snapshot previews.
- Import run logs.
- Change detection.
- Validation reports.
- Diff generation.
- Review queue creation.
- Connector health status.
- Failure logs and alerts.

These operations can prepare decisions, but they cannot make public factual
changes without approval.

## 11. Manual Approval Requirements

Manual approval is required for:

- Results.
- Timing.
- Standings.
- Rider biographies.
- Team changes.
- Manufacturer relationships.
- Motorcycle technical details.
- Media/images.
- Course maps.
- Records.
- Statistics.
- Historical season facts.
- Any conflict between official sources.

## 12. Data Versioning

Every approved fact should create a version record.

Versioning rules:

- Store old value and new value.
- Attach source link and import run when available.
- Store approving user/reviewer.
- Store approval timestamp.
- Preserve rejected changes for audit context.
- Allow rollback to a previous approved value.
- Never overwrite high-risk facts without version history.

Data versioning makes the platform trustworthy because every public fact can be
traced back to the source and the review decision that approved it.

## 13. Data Quality Scoring

Each major entity should eventually have a quality/completion score.

### Event Completeness

Suggested signals:

- Official source linked.
- Dates verified.
- Country/location verified.
- Status verified.
- Stages verified.
- Overall results verified.
- Stage timing verified.
- Documents linked.
- Course maps verified.
- Media approved.

### Rider Completeness

Suggested signals:

- Identity verified.
- Country verified.
- Current team verified.
- Manufacturer/motorcycle verified.
- Biography verified.
- Results linked.
- Profile image approved.
- Sources attached.

### Team Completeness

Suggested signals:

- Team identity verified.
- Country/base verified.
- Type verified.
- Current riders verified.
- Manufacturer partnership verified.
- History verified.
- Results linked.

### Manufacturer Completeness

Suggested signals:

- Brand identity verified.
- Country verified.
- Motorcycle models verified.
- Factory programs verified.
- Rider usage verified.
- Results/performance derived from approved data.

### Source Coverage

Suggested signals:

- Primary source attached.
- Secondary source attached when useful.
- Snapshot exists.
- Source confidence is high.
- Last reviewed date exists.

### Media Coverage

Suggested signals:

- Official media source attached.
- Copyright/license captured.
- Attribution captured.
- Related entities linked.
- Approval status recorded.

Quality scores should guide admin priorities. They should not imply unverified
facts are true.

## 14. Failure Scenarios

### Source Unavailable

- Record failed import run.
- Keep current public data.
- Retry with backoff.
- Notify admin if repeated.

### Page Layout Changed

- Parser should fail closed.
- Create validation error.
- Do not publish partial or malformed data.
- Require adapter update.

### Duplicate Rider Match

- Create ambiguous match review item.
- Do not auto-create or auto-merge rider.
- Preserve candidate matches for reviewer decision.

### Conflicting Result

- Hold proposed change for review.
- Show source comparison.
- Keep existing approved result until resolved.

### Incomplete Timing File

- Import as review-only with warnings.
- Do not calculate standings/statistics from incomplete timing.
- Require official final classification before publishing.

### Wrong Calendar Status

- Treat status changes as review-required.
- Use date-derived status only as a fallback warning, not a source of truth.

### Connector Crash

- Record failure.
- Preserve previous successful snapshot/report.
- Do not affect public pages.

### Database Unavailable

- Connector should fail safely.
- Public pages should render fallback/empty states where possible.
- No partial writes should occur.

### Vercel Build Fallback

- Build should not require live external connectors.
- Public pages should use approved database data or graceful fallbacks.
- Automation failures should not block static assets or public shell rendering.

## 15. Future Expansion

New data types should follow the same pattern:

```text
source registry entry
  -> adapter/parser
  -> intake type
  -> normalization
  -> validation
  -> review item
  -> approved database model
  -> audit/version record
  -> public display
```

Future expansion areas:

- Weather snapshots.
- GPS/GPX files.
- Live timing.
- Interviews.
- Injury reports only when officially reported and appropriate to display.
- Deeper historical archive.
- Public API access.
- Richer admin dashboards.
- Entity quality dashboards.
- Source conflict dashboards.
- Cached/materialized statistics.

Every new data type must define:

- Allowed source types.
- Whether review is required.
- Public display rules.
- Conflict behavior.
- Versioning requirements.
- Failure behavior.

## 16. Public Display Rules

Public pages should present approved knowledge, not pipeline internals.

Use public-facing language:

- "Official course map coming soon"
- "Verified results pending"
- "Race completed"
- "Coming Soon"
- "Live Now"

Avoid public-facing internal language:

- "DataVersion"
- "ImportRun"
- "SourceSnapshot"
- "Pipeline"
- "Adapter"
- "Parser"
- "Pending verification details"

Admin pages may expose those internals because they are operational tools.

## 17. Summary

Hard Enduro World should become a reliable championship knowledge base by being
strict about source authority, entity resolution, review gates, and audit
history.

Automation should make the platform faster to maintain, not less trustworthy.
The correct default is always:

```text
detect automatically
  -> review carefully
  -> publish only approved facts
```
