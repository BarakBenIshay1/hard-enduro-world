# Source Intelligence Platform

The Source Intelligence Platform is the reusable domain layer that every future
connector, automation job, and synchronization process must use.

It is not a connector implementation. It does not scrape, fetch, call APIs,
write to the database, schedule cron jobs, or render UI. It is the backend
contract for source-aware data movement.

Code location:

```text
lib/source-intelligence/
```

## Responsibilities

The Source Intelligence layer owns shared models and pure helpers for:

- source definitions
- source registry support
- connector capability descriptions
- snapshots and import runs
- entity references
- relationship references
- alias-aware entity resolution
- change detection
- verification decisions
- review items
- source health
- source statistics
- connector results
- sync context

It must stay connector-agnostic. FIM, YouTube, Erzbergrodeo, Romaniacs, KTM, and
future sources should all use the same lifecycle and output contracts.

## Module Boundaries

Current modules:

- `types.ts`
  - Shared domain models.
- `source-registry.ts`
  - Reusable source registry entry validation and support checks.
- `normalization.ts`
  - Name, whitespace, case, and accent normalization.
- `entity-resolution.ts`
  - Exact normalized and alias-based matching helpers.
  - Prepared for future fuzzy matching, but fuzzy logic is not implemented.
- `relationships.ts`
  - Supported relationship types and relationship object creation.
- `change-detection.ts`
  - Change item and change set helpers.
- `verification.ts`
  - Verification decision models and status recommendations.
- `review.ts`
  - Review item creation from detected changes.
- `source-health.ts`
  - Source health and source statistics helpers.
- `lifecycle.ts`
  - The canonical source intelligence lifecycle steps.
- `connector-contract.ts`
  - The interface every future connector must satisfy.
- `index.ts`
  - Public exports for the package.

## Core Lifecycle

Every future connector must follow this lifecycle:

```text
Official Source
  -> Source Snapshot
  -> Normalization
  -> Entity Resolution
  -> Relationship Resolution
  -> Change Detection
  -> Verification
  -> Review Queue
  -> Approval
  -> Database Update
  -> Audit Log
  -> Website Refresh
```

The current foundation prepares the lifecycle models and helper objects only.
Approval, database update, audit persistence, website refresh, cron scheduling,
and real connector fetching are intentionally not implemented here.

## Source Registry Lifecycle

Every source should be described with:

- source id
- display name
- priority
- confidence
- supported entity types
- supported content types
- connector version
- enabled/disabled state
- refresh frequency
- maximum retry count
- backoff strategy
- owner
- documentation link

Sources should declare exactly what they are allowed to provide. A trusted media
source, for example, may provide video metadata but must not create official
results, timing, standings, or rider facts.

## Connector Lifecycle

Every connector must eventually produce the same shape of output:

- `SourceSnapshot`
- `ImportRun`
- `ChangeSet`
- `ReviewItem[]`
- `SourceHealth`
- warnings
- errors

Connector output should be review-ready, not publish-ready.

The connector contract is defined in:

```text
lib/source-intelligence/connector-contract.ts
```

Until approval persistence exists, connectors must run in dry-run mode.

## Entity Lifecycle

Incoming source rows should never directly create public facts.

Entity flow:

```text
source row
  -> EntityReference
  -> normalized name
  -> alias check
  -> exact match / ambiguous / not found
  -> review item when needed
```

Supported entity types:

- Rider
- Team
- Manufacturer
- Motorcycle
- Event
- Stage
- Result
- Season
- Video
- Media
- Document
- Course Map
- History Record
- Source

Unknown matches must remain unresolved. The system should not create duplicate
riders, teams, events, or motorcycles because of abbreviated names or sponsor
variations.

## Relationship Lifecycle

Relationships should be represented explicitly before being reviewed.

Supported relationship examples:

- Video -> Rider
- Video -> Team
- Video -> Manufacturer
- Video -> Event
- Video -> Stage
- Result -> Rider
- Result -> Event
- Result -> Stage
- Event -> Team
- Event -> Manufacturer
- Manufacturer -> Motorcycle
- Team -> Rider
- Rider -> Motorcycle
- Season -> Events
- Season -> Standings
- Media -> Event
- Media -> Rider
- Media -> Team

Relationship objects include:

- relationship type
- source entity
- target entity
- confidence
- source ids
- notes

This lets future connectors describe relationships without mutating the
database.

## Change Detection Lifecycle

Change detection supports:

- New Entity
- Removed Entity
- Updated Entity
- Metadata Change
- Relationship Change
- Media Change
- Document Change
- Status Change

A `ChangeSet` groups detected `ChangeItem` objects and summarizes what changed.
Change detection should compare normalized source output against the current
approved database state or verified data layer.

The foundation does not write changes. It only prepares reviewable objects.

## Verification Lifecycle

Verification statuses:

- Verified
- Pending
- Rejected
- Needs Review
- Conflicting Sources
- Unknown

Verification decisions should include:

- status
- reason
- source ids
- confidence
- reviewer id when available
- decision timestamp when available

No future connector should publish directly from source confidence alone. Source
confidence helps prioritize review; it is not approval.

## Review Lifecycle

Review items describe:

- changed fields
- previous value
- new value
- source
- confidence
- priority
- affected entities
- recommended action
- timestamp

Recommended actions:

- approve
- reject
- request more evidence
- merge

Review items are reusable domain objects. Persisted review tables and approval
mutations are separate future work.

## Source Health Lifecycle

Every source should eventually expose:

- last successful sync
- last failed sync
- current status
- average latency
- confidence
- priority
- supported entities
- supported content types
- connector version
- last reviewed date

This enables admin and automation systems to understand which sources are
healthy, stale, failing, disabled, or needing review.

## Entity Resolution Strategy

Current resolution supports:

- aliases
- normalized names
- case-insensitive matching
- whitespace normalization
- accent normalization

Future resolution may support fuzzy matching, but this foundation intentionally
does not implement fuzzy logic. Fuzzy matching should be added only after exact
and alias-based matching are proven, tested, and review-safe.

Examples the architecture must support:

- `Manuel Lettenbichler` vs `M. Lettenbichler`
- `Red Bull KTM` vs `Red Bull KTM Factory Racing`
- sponsor names by event year
- motorcycle model naming differences

Ambiguous matches must produce review items, not automatic merges.

## Future Expansion Strategy

Future connectors should be able to plug into this layer without inventing new
domain contracts.

Planned connector families:

- FIM calendar
- Hard Enduro official calendar
- Red Bull Erzbergrodeo results
- Romaniacs results
- Sea to Sky results
- official PDFs
- official timing CSV
- KTM rider profile
- manufacturer profiles
- YouTube/media

Future data types:

- weather
- GPS/GPX
- live timing
- interviews
- official injury updates where appropriate
- historical archive
- public API output
- admin quality dashboards

Every new source or data type must define:

- supported entity types
- supported content types
- source confidence
- review requirements
- relationship behavior
- failure behavior

## Non-Goals

This foundation does not:

- scrape websites
- call external APIs
- schedule jobs
- connect to YouTube
- connect to FIM
- write to the database
- change Prisma schema
- create seed data
- create UI components
- approve or publish facts

The correct output of this layer is a safe, typed, review-ready description of
what a connector found and what should happen next.
