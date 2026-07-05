# Automation Design Review

This review audits the current automation architecture before real official data
sync begins.

Scope reviewed:

- `docs/architecture/master-data-architecture.md`
- `docs/automated-data-sync-plan.md`
- `data/verified/source-registry.ts`
- `data/verified/adapters/`
- `data/verified/pipeline/`
- `jobs/automation/`
- `jobs/connectors/`
- `db/sources.ts`
- `db/audit.ts`
- `db/automation.ts`
- `prisma/schema.prisma`

No implementation is included in this review.

## 1. Current Architecture Summary

The current architecture is review-first and source-aware.

Main flow:

```text
Official source registry
  -> adapter factory
  -> connector
  -> intake/normalization
  -> validation
  -> diff/review package
  -> future admin approval
  -> future database update
  -> audit/version history
  -> public website
```

Current layers:

- Source registry:
  - Defines official/trusted sources, allowed data types, trust levels, and
    review requirements.
- Adapter layer:
  - Provides a source-isolated interface and factory.
  - Includes HTML adapter foundations.
- Verified pipeline:
  - Supports intake, normalization, validation, review packages, and summaries.
- Automation layer:
  - Defines job metadata, risk level, frequency, and placeholder runner output.
- Connector layer:
  - Includes generic events, results, and YouTube connector foundations.
- Database layer:
  - Includes `DataSource`, `SourceSnapshot`, `ImportRun`, `SourceLink`, and
    `DataVersion`.

The architecture is ready for dry-run connector work. It is not ready for
automatic writes or live cron execution.

## 2. Existing Strengths

- Strong source allow-list:
  - `data/verified/source-registry.ts` blocks unregistered sources and marks
    media-only sources clearly.
- Data-type permission model:
  - Sources declare whether they can provide events, results, standings, media,
    documents, or timing.
- Review-first principle:
  - Registry entries require review.
  - Current plans explicitly prohibit auto-publishing.
- High-risk separation:
  - Results, timing, standings, statistics, and records are treated as high-risk.
- Dynamic event/stage thinking:
  - The data model supports arbitrary stage structures instead of hardcoded day
    names.
- Existing source tracking models:
  - `DataSource`, `SourceSnapshot`, `ImportRun`, `SourceLink`, and `DataVersion`
    exist in Prisma.
- Existing dry-run/preview patterns:
  - Current connectors already build source-tracking previews and review items.
- Media-only safety:
  - YouTube/media sources are not allowed to create official results.
- Unknown value discipline:
  - Docs and verified pipeline require unknown values to stay null.
- Public/private separation:
  - Public pages are not supposed to expose internal pipeline terms.

## 3. Missing Pieces

The following are missing before production-grade automation:

- A dedicated source-specific FIM Calendar connector.
- A durable change report format for dry-run output.
- Entity resolution service for riders, teams, events, manufacturers, and
  motorcycles.
- Confidence scoring beyond simple source confidence labels.
- A persisted review item model/table.
- Approval/rejection mutations.
- Connector locking to prevent overlapping runs.
- Retry/backoff orchestration.
- Rate-limit policy per source.
- Snapshot persistence policy for dry-run connectors.
- Runtime guard that blocks non-dry-run writes until approval exists.
- Source-specific parser tests.
- Parser fixture strategy.
- Admin-visible dry-run reports.
- Rollback workflow built on `DataVersion`.

## 4. Risks Before Real Connectors

- The generic events connector can fetch from `OFFICIAL_EVENTS_URL`, but it does
  not yet enforce a source-specific FIM contract.
- A connector could normalize data without robust entity matching.
- Calendar status could be inferred incorrectly from dates.
- Duplicate events may be created if sponsor names differ by year.
- Result connectors may parse provisional timing as final classification.
- Imported riders may duplicate existing canonical profiles.
- Source confidence is not yet granular enough for field-level review.
- Review items are currently typed objects, not durable database records.
- There is no lock preventing duplicate connector runs.
- There is no approval mutation boundary yet.
- There is no automated rollback flow beyond version data foundations.
- Database availability failures are not yet wrapped by connector-safe recovery.

## 5. Required Guardrails

Before any real connector moves beyond local dry-run:

- Require `dryRun: true` for all official connectors.
- Block database writes in connector code paths.
- Require a registered source id for every source-derived fact.
- Enforce source `allowedDataTypes` before normalization output is accepted.
- Reject media-only sources for results, standings, timing, records, and
  biographies.
- Preserve unknown fields as null.
- Create a change report for every run.
- Include source URL and fetched timestamp in every proposed change.
- Include confidence and validation issues in every review item.
- Require manual review for calendar changes, even if low risk.
- Keep results/timing/standings/statistics/records fully review-only.
- Require entity resolution confidence before matching source rows to internal
  entities.
- Prevent cron execution until connector locks and failure reporting exist.

## 6. Data Flow Gaps

Current flow gaps:

- Connector output is not yet standardized across all source types.
- Generic connector review items are not the same shape as verified pipeline
  review packages.
- Change reports do not yet compare against both:
  - current database state
  - verified data files
- Source snapshot previews exist, but persistence behavior is not defined per
  environment.
- `DataVersion` stores previous/next values, but review decision status is not
  explicit.
- Import run counts do not distinguish "detected", "proposed", "approved", and
  "published".
- There is no canonical "dry-run report" object shared by connectors.

Recommended fix before FIM connector implementation:

- Define one dry-run report type that includes source metadata, normalized rows,
  entity matches, diffs, validation issues, and review recommendations.

## 7. Entity Resolution Gaps

Current entity matching is not yet production-ready.

Missing resolution support:

- Rider aliases:
  - Example: `Manuel Lettenbichler`, `M. Lettenbichler`, `Mani Lettenbichler`.
- Team aliases:
  - Example: `Red Bull KTM`, `Red Bull KTM Factory Racing`.
- Event family aliases:
  - Sponsor/title changes by year.
- Motorcycle model aliases:
  - Example: `KTM 300 EXC`, `KTM EXC 300`, `300 EXC`.
- Country normalization:
  - Names, ISO codes, and source-specific spelling differences.
- External source identifiers:
  - Official ids are not yet stored as first-class mappings.

For the FIM Calendar dry-run connector, entity resolution can start with events
only:

- Match by official URL when available.
- Match by season year + normalized event name + country/location.
- Use slug candidate only as a fallback.
- Mark ambiguous matches as review-required.

## 8. Source Confidence Gaps

The registry has trust levels and source confidence, but confidence is not yet
field-level.

Gaps:

- A single source may be primary for event dates but weak for rider biography.
- A source may provide provisional status but not final status.
- A parsed row may be high confidence while a rider match is medium confidence.
- Review packages do not yet clearly separate:
  - source confidence
  - parser confidence
  - entity match confidence
  - field confidence

Recommended model for dry-run reports:

- `sourceConfidence`
- `parserConfidence`
- `entityMatchConfidence`
- `fieldConfidence`
- `overallRecommendation`

For the first connector, this can stay in TypeScript/report objects and does not
need a schema change yet.

## 9. Review / Approval Workflow Gaps

Current review support is enough for previews, but not approvals.

Gaps:

- No dedicated persisted `ReviewItem` model.
- No review decision model with reviewer id, decision time, and notes.
- No approval mutation.
- No rejection mutation.
- No partial approval support.
- No "needs more source evidence" state.
- No direct link from a review item to a future `DataVersion`.
- No explicit public/published status for approved changes.

Current schema can represent some of this indirectly through `ImportRun` and
`DataVersion`, but that is not enough for production approvals.

Recommendation:

- Do not implement approval yet.
- Let the FIM connector produce dry-run reports first.
- Add persisted review items only after the report shape is proven.

## 10. Cron / Locking / Failure-Handling Gaps

Cron is not ready.

Gaps:

- No connector lock table or lock service.
- No "last successful run by job/source" service.
- No retry count or retry schedule.
- No exponential backoff.
- No source-specific rate limit configuration.
- No timeout policy per connector.
- No circuit breaker for repeated failures.
- No alerting/notification strategy.
- No isolation between manual dry-run and scheduled run.

Required before cron:

- Lock key based on job id + source id.
- Maximum run duration.
- Failure count and paused-after-failure threshold.
- Retry/backoff rules.
- Admin-visible failure report.
- Hard guarantee that cron cannot publish facts.

## 11. Database / Schema Gaps

Current schema has a good foundation:

- `DataSource`
- `SourceSnapshot`
- `SourceLink`
- `ImportRun`
- `DataVersion`
- `Result`
- `StageResult`
- `RaceStage`
- `Event`
- `Standing`

Potential gaps before production automation:

- No dedicated persisted review item table.
- No job lock table.
- No external source id mapping table for entity resolution.
- No alias table for rider/team/event/manufacturer/motorcycle names.
- `DataSource` does not include registry source id, allowed data types, or trust
  level directly.
- `ImportRun` does not distinguish dry-run from publish-capable run except via
  metadata.
- `DataVersion` does not include review status or reviewer decision fields.
- Course map entities are not clearly first-class yet; current map support is
  UI/data-architecture level.
- Field-level confidence is not persisted.

Schema change recommendation:

- No schema change is required before a dry-run-only FIM Calendar connector.
- Schema changes are required before production approval/publish workflows.

## 12. Recommended Implementation Order

1. Define shared dry-run report types.
2. Implement source-specific FIM Calendar connector in dry-run mode only.
3. Add fixture/local sample tests for FIM calendar parsing.
4. Add event-only entity resolution helpers.
5. Compare FIM dry-run output against current database and verified data files.
6. Render or export a readable dry-run change report.
7. Add connector lock/failure design before any scheduled cron.
8. Add persisted review item schema and approval mutations.
9. Add Red Bull Erzbergrodeo results connector in dry-run mode only.
10. Add KTM rider profile connector in dry-run mode only.
11. Add official PDF/CSV timing adapters.
12. Add derived recalculation preview integration.
13. Only then consider scheduled cron.

## 13. First Connector Readiness Checklist

FIM Calendar dry-run connector can start when the following are true:

- Source id is registered:
  - `fim-official`
- Source is allowed to provide:
  - `events`
- Connector is dry-run only.
- Connector cannot call approval or publish mutations.
- Connector cannot create/update `Event` records.
- Output includes a dry-run change report.
- Output includes source URL and fetched timestamp.
- Output includes validation issues.
- Output includes event match confidence.
- Output compares against current database events.
- Output compares against verified data/coverage where useful.
- New event, date change, location change, country change, status change, and
  URL change are all review-required.
- No winners, podiums, results, standings, statistics, records, riders, teams,
  manufacturers, or motorcycles are produced.
- Ambiguous event matches are not auto-resolved.
- Missing values remain null.
- Failures return a report instead of throwing into public rendering.

Not required for first dry-run:

- Cron.
- Database writes.
- Persisted review items.
- Approval mutations.
- Admin UI changes.
- Results parsing.
- PDF parsing.

## 14. Go / No-Go Recommendation

Recommendation: **Go, with limits.**

The architecture is ready to start the FIM Calendar dry-run connector if the
implementation is limited to:

- source-specific calendar parsing
- dry-run execution
- no database writes
- no cron
- no auto-publishing
- no result imports
- no standings/statistics/records changes
- event-only change reports
- review-required output

Recommendation: **No-go** for production automation, scheduled cron, approval
mutations, result imports, live timing imports, or public auto-updates.

The first implementation should prove that the platform can safely answer one
question:

```text
What would change in the current event calendar if we trusted this official FIM
source, and what must a human review before anything becomes public?
```

Once that answer is reliable, the same pattern can be reused for higher-risk
connectors.
