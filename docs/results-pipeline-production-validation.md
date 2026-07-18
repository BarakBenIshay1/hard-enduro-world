# Production Results Pipeline Validation

This note records the production validation run for the controlled Erzbergrodeo 2026 results pipelines.

## Scope

Validated pipelines:

- Overall results connector: `official-results-overall`
- Stage results connector: `official-stage-results`
- Event: `erzbergrodeo-2026`
- Source: Red Bull Erzbergrodeo official results materials
- Database: configured Supabase database

The validation confirmed the review-first flow:

Official source
→ immutable snapshot
→ import run
→ normalize and match
→ review item
→ approve or reject
→ explicit apply
→ `Result` or `StageResult`
→ `SourceLink`
→ `DataVersion`

No connector run writes public results directly.

## Official Source Evidence

The public Red Bull Erzbergrodeo site exposes the 2026 results area at:

- `https://www.redbullerzbergrodeo.com/`
- `https://www.redbullerzbergrodeo.com/resultate`
- official race result PDF: `https://www.redbullerzbergrodeo.com/_files/ugd/99f05a_ee5959845e6c47beabc2f3652bb301b6.pdf`

The official PDF confirms the top classification rows used by the current controlled fixtures:

- Manuel Lettenbichler
- Trystan Hart
- Mario Roman Serrano
- Teodor Kabakchiev
- Mitch Brightmore
- Michael Walkner

The current importer remains intentionally narrow. It does not import lower rows until entity matching, source parsing, and review coverage are ready for the broader official classification. Position 6 is intentionally not included because the current database does not have a deterministic matching Rider entity for that official row. Motorcycle fields remain null for the added rows because the current importer only accepts exact model matches and no model should be guessed from the PDF text.

## Migration Status

The existing migration `20260715000400_stage_results_review_pipeline` was applied with `pnpm prisma migrate deploy`.

Final migration status:

- Database schema is up to date.
- No new migration was created during this validation.

## Baseline Before Apply

The event already contained:

- Event ID: `cmr0seeg20086u9qa5l84or9f`
- Race stages:
  - Prologue: `cmr0seewv008hu9qam9c32sjr`
  - Day 1: `cmr0sef1q008ju9qagiulvno6`
  - Day 2: `cmr0sef3q008lu9qa1ek0cxta`
  - Final: `cmr0sef5q008nu9qarr5z2f7f`
- Existing overall `Result` rows: 3 legacy/manual `Pro` rows
- Existing final-stage `StageResult` rows: 0
- Existing `SourceLink` rows for Result/StageResult: 0
- Existing `DataVersion` rows for Result/StageResult: 0

## Initial Overall Results Dry Run

Command:

```bash
RESULTS_IMPORT_PERSIST_REVIEW=true pnpm run connector:results-overall:dry-run
```

Result:

- Rows parsed: 3
- New result proposals: 3
- Changed proposals: 0
- Unchanged rows: 0
- Blocked rows: 0
- Result rows written: 0
- Snapshot status: created
- ConnectorSnapshot: `cmrm9hiqa0005u9t4pkf1svju`
- SourceSnapshot: `cmrm9hi9n0002u9t43jotr35x`
- ImportRun: `cmrm9hiej0004u9t40f8eem0f`
- Review items created: 3

The connector proposed `Overall` class rows. Existing manual `Pro` rows were not overwritten.

## Expanded Overall Results Dry Run

After inspecting the official PDF, the controlled fixture was expanded from 3 to 6 verified rows:

- P4 Teodor Kabakchiev
- P5 Mitch Brightmore
- P7 Michael Walkner

Command:

```bash
RESULTS_IMPORT_PERSIST_REVIEW=true pnpm run connector:results-overall:dry-run
```

Result:

- Rows parsed: 6
- New result proposals: 5
- Changed proposals: 0
- Unchanged rows: 1
- Blocked rows: 0
- Result rows written: 0
- Snapshot status: created
- ConnectorSnapshot: `cmrmbu3jf0004u9z3wpc8bzt6`
- SourceSnapshot: `cmrmbu34v0001u9z3xn2bpqpe`
- ImportRun: `cmrmbu38y0003u9z30pxslgi3`
- Review items created: 3
- Review items reused: 2
- Pending review items: 5

## Initial Stage Results Dry Run

Command:

```bash
STAGE_RESULTS_IMPORT_PERSIST_REVIEW=true pnpm run connector:stage-results:dry-run
```

Result:

- Rows parsed: 3
- New stage proposals: 3
- Changed proposals: 0
- Unchanged rows: 0
- Missing-source warnings: 0
- Blocked rows: 0
- StageResult rows written: 0
- Overall Result rows written: 0
- Snapshot status: created
- ConnectorSnapshot: `cmrm9jjzy0005u923hn0nxaqd`
- SourceSnapshot: `cmrm9jjlv0002u923p09gtqxt`
- ImportRun: `cmrm9jjs30004u923fr5yw0db`
- Review items created: 3

## Expanded Stage Results Dry Run

The stage fixture was expanded with the same verified official subset.

Command:

```bash
STAGE_RESULTS_IMPORT_PERSIST_REVIEW=true pnpm run connector:stage-results:dry-run
```

Result:

- Rows parsed: 6
- New stage proposals: 5
- Changed proposals: 0
- Unchanged rows: 1
- Missing-source warnings: 0
- Blocked rows: 0
- StageResult rows written: 0
- Overall Result rows written: 0
- Snapshot status: created
- ConnectorSnapshot: `cmrmbvntt0004u94ce0yqkicb`
- SourceSnapshot: `cmrmbvn8q0001u94c20kczyhc`
- ImportRun: `cmrmbvnf10003u94cof7mg326`
- Review items created: 3
- Review items reused: 2
- Pending review items: 5

## Approval and Explicit Apply

The validation approved and applied the smallest safe subset:

- Overall review item: `cmrm9hj8q0007u9t4pvgmq1q0`
- Stage review item: `cmrm9jkh00007u923cz9bl9kw`
- Actor: existing OWNER user `barakbenishay1@gmail.com`

Approval-only validation:

- Review items moved to `APPROVED`.
- No `Result` rows were inserted during approval.
- No `StageResult` rows were inserted during approval.
- No public page write occurred.

Explicit apply validation:

- Applied `Result` ID: `cmrm9q7gl0003u9cla3nwx9kf`
- Applied `StageResult` ID: `cmrm9q9g50009u9clevnkpfn5`
- `SourceLink` rows created: 2
- `DataVersion` rows created: 2
- Existing manual `Pro` overall rows remained untouched.
- No standings, statistics, records, or public pages were recalculated.

Repeated apply attempts returned `already-applied` and created no duplicate rows.

## Repeat Import Behavior

After one overall and one stage row were applied, the same persistence-enabled imports were run again.

Overall repeat:

- Rows parsed: 3
- New proposals: 2
- Unchanged rows: 1
- Review items created: 0
- Review items reused: 2
- Result rows written: 0

Stage repeat:

- Rows parsed: 3
- New proposals: 2
- Unchanged rows: 1
- Missing-source warnings: 0
- Review items created: 0
- Review items reused: 2
- StageResult rows written: 0
- Overall Result rows written: 0

The applied Manuel Lettenbichler rows were not reopened as new proposals.

## Missing-From-Source Validation

The stage fixture was temporarily narrowed to remove the already applied Manuel Lettenbichler source row.

Result:

- A non-applyable `STAGE_RESULT_MISSING_SOURCE` warning was created.
- Warning review item: `cmrm9u9ip0006u9r2ujbvehn4`
- The existing `StageResult` was not archived, deleted, or modified.
- The warning included the comparison scope:
  - event ID
  - stage ID
  - source ID
  - class name
  - stage slug

After restoring the source row and rerunning the connector:

- The connector reused the duplicate current snapshot.
- The obsolete pending missing-source warning was superseded.
- The existing source-managed `StageResult` remained unchanged.

This confirms missing-source comparison works even when the latest restored payload reuses an existing connector snapshot.

## Stale-State Protection

Focused tests now cover stale-state protection for:

- Result update apply
- StageResult update apply

If a reviewed current value no longer matches the database at apply time, the apply path rejects the proposal and requires review regeneration.

## Source Lineage and Audit

Applied records include source lineage:

- Result `SourceLink`: `cmrm9q7so0005u9clqaic6ggt`
- StageResult `SourceLink`: `cmrm9q9or000bu9cle03ey72u`

Applied records include data-version history:

- Result `DataVersion`: `cmrm9q84m0006u9clejv5bh16`
- StageResult `DataVersion`: `cmrm9q9va000cu9clq4mjqtty`

The pipeline can identify:

- which source produced the row
- which review item approved the change
- what changed
- who approved/applied the change
- when the change was applied

### SourceLink Canonicalization Incident Note

On 2026-07-18, two existing Erzbergrodeo `SourceLink` rows were canonicalized:

- `cmrm9q7so0005u9clqaic6ggt`: `Result` -> `RESULT`
- `cmrm9q9or000bu9cle03ey72u`: `StageResult` -> `STAGE_RESULT`

The values were retained by explicit owner decision after audit. The change is
recorded by `DataVersion` rows `cmrqh7qfj0000u99tu6yu0l78` and
`cmrqh7qtl0001u99tgeuxjkv4`. No retrospective Review approval or Apply history
was created. The audit identified the direct production repair as an
authorization-path violation because it bypassed Review/permission controls.
Future production data repair scripts must not bypass those controls.

## Final Persisted State

For `erzbergrodeo-2026`:

- Source-managed overall Results applied: 1
- Source-managed StageResults applied: 1
- Pending overall result proposals remaining: 5
- Pending stage result proposals remaining: 5
- Superseded missing-source warnings: 1
- Overall connector snapshots: 3
- Stage connector snapshots: 4
- Overall import runs: 3
- Stage import runs: 6
- Standing `DataVersion` rows created by this validation: 0
- ChampionshipRecord `DataVersion` rows created by this validation: 0

## Guardrails Confirmed

- Dry-run and persistence-enabled connector runs wrote zero `Result` or `StageResult` rows.
- Approval alone wrote zero `Result` or `StageResult` rows.
- Only explicit apply wrote result rows.
- Repeated apply was idempotent.
- Missing-source warnings were non-applyable.
- Missing-source warnings never deleted or modified stored StageResults.
- Existing manual results remained intact.
- StageResult apply did not mutate overall Result rows.
- No standings, points, statistics, records, cron, or public publishing was triggered.

## Known Limitations

- The current controlled fixture is limited to a verified six-row subset: positions 1, 2, 3, 4, 5, and 7.
- The broader official PDF classification is not yet parsed by a source-specific adapter.
- Lower classification rows require deterministic rider and equipment matching before controlled import.
- `RaceStage` does not yet store official source stage IDs directly; explicit aliases are currently the strongest available source-stage match.

## Recommended Next Sprint

Build a source-specific official Erzbergrodeo results adapter for the full official race classification PDF or a structured official export if one is available. The sprint should prepare entity matching for additional official finishers before expanding applied rows beyond the currently verified subset.
