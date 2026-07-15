# Controlled Stage Results Import Pipeline

This pipeline extends the controlled overall Results importer to official stage-level results.

## Existing RaceStage Architecture

`RaceStage` already supports the required stage anchors:

- `eventId` relation to `Event`
- `name`
- `slug`
- `stageType`
- `stageOrder`
- `status`
- optional `startDate`, `endDate`, `distanceKm`, `officialUrl`, `notes`

Constraints:

- unique `(eventId, slug)`
- unique `(eventId, stageOrder)`
- indexed `eventId`

The selected event already has stored stage rows from the schedule/course seed. No schema change was required for `RaceStage`.

## Selected Stage Source

- Source identity: Red Bull Erzbergrodeo Official Stage Results
- Connector key: `official-stage-results`
- First event scope: `erzbergrodeo-2026`
- Stage scope: Main Race / internal `final` stage
- Payload format: CSV fixture or explicitly configured official source URL
- Fixture: `jobs/connectors/results/fixtures/erzbergrodeo-2026-main-race-stage-results.csv`

The first fixture is intentionally limited to the verified Erzbergrodeo 2026 podium subset. It does not invent stage times, gaps, lower finishers, points, standings, statistics, records, or stage rows.

## Flow

Official stage results source
→ immutable `SourceSnapshot`
→ `ImportRun`
→ normalized stage result proposals
→ Event, RaceStage, Rider, and equipment matching
→ `ConnectorSnapshot`
→ `ConnectorReviewItem`
→ approve/reject
→ explicit apply
→ `StageResult`
→ `SourceLink`
→ `DataVersion`

Connector execution never writes `StageResult` rows directly.

## Stage Matching

Matching order:

1. Stored official source stage ID, when available
2. Explicit source stage alias
3. Exact internal stage slug
4. Exact normalized stage name
5. Event plus stage order
6. Unresolved or ambiguous

The first alias maps source stage ID `erzbergrodeo-2026-main-race` to the existing `final` stage for `erzbergrodeo-2026`.

Ambiguous or unresolved stage matches are visible in Import Review and cannot be applied.

Current limitation: `RaceStage` does not currently store an official source stage ID, and `SourceLink` does not carry a source-stage identifier for `RaceStage`. Because of that, stored official source stage ID matching is documented as the preferred future priority but is not currently available in the schema. The strongest available stage-specific match today is the explicit source-stage alias.

## Supported Fields

Stage proposals support:

- Event
- RaceStage
- Rider
- Stage position
- Result status
- Stage time text and milliseconds, when supplied
- Gap to leader text
- Gap to previous text
- Manufacturer
- Motorcycle
- Team context
- Class name
- Official raw source row

Supported statuses:

- `FINISHED`
- `DNF`
- `DNS`
- `DSQ`
- `UNKNOWN`

Null values remain null. Missing values are never converted to zero, empty strings, default times, or inferred positions.

## Review Actions

Stage result review actions extend the existing connector review enum:

- `NEW_STAGE_RESULT`
- `UPDATE_STAGE_RESULT`
- `STAGE_RESULT_CONFLICT`
- `STAGE_RESULT_UNRESOLVED`
- `STAGE_RESULT_INVALID`
- `STAGE_RESULT_MISSING_SOURCE`

Only `NEW_STAGE_RESULT` and `UPDATE_STAGE_RESULT` are applyable.

## Missing From Source

Every stage import compares the latest normalized stage-source rows with existing source-managed `StageResult` rows in the same event, stage, and class scope.

A `StageResult` is considered source-managed only when it has existing `SourceLink` lineage for this connector's `DataSource`. Manual rows or rows linked to unrelated sources are not flagged.

When a source-managed row is absent from the newest source snapshot, the connector creates or reuses a non-applyable `STAGE_RESULT_MISSING_SOURCE` review item. The warning includes:

- existing StageResult state
- source snapshot lineage
- comparison scope
- matched RaceStage
- rider/equipment context

Missing-source warnings never archive, delete, or modify the existing `StageResult`. If the row appears again in a later source snapshot, obsolete pending missing-source warnings for that StageResult are superseded.

## Apply Behavior

Approved StageResult review items require a second explicit apply action. Apply:

- Revalidates Event, RaceStage, Rider, Manufacturer, and Motorcycle references.
- Confirms the RaceStage belongs to the matched Event.
- Uses a StageResult field allowlist.
- Runs in a transaction.
- Detects stale current state.
- Prevents duplicate `(stageId, riderId, className)` rows.
- Creates `SourceLink` lineage.
- Creates `DataVersion` history.
- Marks the review item applied only after the StageResult write succeeds.

StageResult apply does not modify overall `Result`, standings, points, records, or statistics.

## Validation Rules

- `StageResult` must reference an existing `RaceStage`.
- `RaceStage` must belong to the matched Event.
- `StageResult` must reference an existing Rider.
- A Rider cannot have duplicate Stage Results for the same stage and class scope.
- Finished stage positions must be positive integers.
- `DNS` cannot receive a finished position or fabricated stage time.
- Missing stage times remain null.
- Invalid time formats block apply.
- Ambiguous or unresolved stage matching blocks apply.
- Optional Manufacturer and Motorcycle references must resolve when supplied.
- Rows missing from a newer source are warnings only and never delete existing rows.

## Known Limitations

- No stage-results CMS is included.
- No automatic RaceStage creation is included.
- No overall Result recalculation is included.
- No standings, points, statistics, or records are calculated.
- The first source is a narrow Erzbergrodeo main-race stage subset.
- Stored official source stage ID matching is not available until `RaceStage` or a source-mapping table stores source-stage identifiers.

## Next Sprint

Recommended next sprint: expand the same controlled stage pipeline to a fuller official stage classification source, including source-stage identifier mapping if the official source exposes stable stage IDs.
