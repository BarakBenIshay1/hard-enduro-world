# Controlled Overall Results Import Pipeline

This pipeline imports official overall event classifications through the existing review-first architecture.

## Selected Source

- Source identity: Red Bull Erzbergrodeo Official Results
- Connector key: `official-results-overall`
- First event scope: `erzbergrodeo-2026`
- Payload format: CSV fixture or explicitly configured official source URL
- Fixture: `jobs/connectors/results/fixtures/erzbergrodeo-2026-overall-results.csv`

The first source is intentionally limited to verified Erzbergrodeo 2026 rows that can be matched to existing Rider and Manufacturer records. It starts with the podium and a small additional official subset. It does not invent lower finishers, timing, points, standings, stage results, or statistics.

## Flow

Official results source
→ immutable `SourceSnapshot`
→ `ImportRun`
→ normalized overall result proposals
→ deterministic entity matching
→ `ConnectorSnapshot`
→ `ConnectorReviewItem`
→ approve/reject
→ explicit apply
→ `Result`
→ `SourceLink`
→ `DataVersion`

Connector execution never writes `Result` rows directly.

## Snapshot Lifecycle

Every persistence-enabled run records generic source lineage with `DataSource`, `SourceSnapshot`, and `ImportRun`.

The connector review snapshot uses a deterministic checksum of the normalized payload. When an unchanged payload has already been captured for the same connector and season, the existing connector snapshot is reused and duplicate actionable review proposals are not created.

## Entity Matching

The pipeline resolves entities in this order:

1. Existing stable slug or identifier when supplied.
2. Exact normalized name for supported entities.
3. Explicit unresolved state when no deterministic match exists.

The first implementation resolves:

- Event
- Rider
- Manufacturer
- Motorcycle
- Team as informational metadata only

The pipeline does not automatically create Riders, Teams, Manufacturers, or Motorcycles. Required unresolved Event or Rider matches block apply. Optional supplied Manufacturer or Motorcycle values must resolve before apply.

## Supported Result Fields

Overall result proposals support:

- Event
- Rider
- Overall position
- Result status
- Manufacturer
- Motorcycle
- Overall time text
- Gap to leader text
- Gap to previous text
- Class name
- Official raw source row

Supported statuses:

- `FINISHED`
- `DNF`
- `DNS`
- `DSQ`
- `UNKNOWN`

## Validation Rules

- A Result must reference an existing Event.
- A Result must reference an existing Rider.
- Duplicate Results for the same Event, Rider, and class scope are blocked.
- Finished positions must be positive integers.
- `DNS` rows cannot receive a finished position.
- Invalid or ambiguous source values block apply.
- Rows absent from a newer source snapshot are never deleted automatically.
- Stage results, standings, points, records, and statistics are out of scope.

## Review Lifecycle

Result review actions are stored in the existing `ConnectorReviewItem` queue:

- `NEW_RESULT`
- `UPDATE_RESULT`
- `RESULT_CONFLICT`
- `RESULT_UNRESOLVED`
- `RESULT_INVALID`
- `RESULT_MISSING_SOURCE`

Only `NEW_RESULT` and `UPDATE_RESULT` are applyable. The other actions require manual verification or a future explicit policy.

## Apply Behavior

Approved Result review items require a second explicit apply action. Apply:

- Revalidates the proposal.
- Uses a Result field allowlist.
- Runs in a transaction.
- Detects stale current state.
- Prevents duplicate Result rows.
- Creates `SourceLink` lineage.
- Creates `DataVersion` audit history.
- Marks the review item applied only after the Result write succeeds.

## Known Limitations

- Stage results are not imported.
- Championship points are not calculated.
- Standings are not recalculated.
- Missing-source rows are warnings only and never delete Results.
- The first source is a narrow Erzbergrodeo overall classification path.
- The official race PDF contains more rows than the current fixture, but rows are added only when required entities already resolve deterministically.

## Next Sprint

Recommended next sprint: add a source-specific Stage Results review pipeline using the same snapshot, review, approval, apply, source lineage, and audit architecture.
