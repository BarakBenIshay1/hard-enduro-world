# Official Results Connector

Step 28 upgrades the official results connector foundation to support real source fetches while keeping all imported result data review-only.

This connector is high risk. It must never auto-publish and must never update standings, statistics, records, history, riders, teams, manufacturers, or motorcycles.

## Environment Configuration

Use the placeholder in `.env.example`:

- `OFFICIAL_RESULTS_URL=`

No real secrets are required. The URL should point to an official timing, FIM results, event results, timing export, or official PDF URL when configured later.

If `OFFICIAL_RESULTS_URL` is missing, the connector uses safe demo fallback data and marks the connector status as `demo-fallback` / `missing-config`.

## Supported Payloads

The connector is prepared for:

- HTML pages
- JSON payloads
- CSV/timing exports
- Official PDFs as metadata only

PDF parsing is intentionally not implemented in Step 28. PDF sources can be detected and represented as metadata-only snapshots for future parser work.

## Supported Preview Fields

The normalized preview supports:

- Event
- Stage or overall classification
- Rider
- Country
- Team
- Manufacturer
- Motorcycle
- Position
- Time
- Gap to leader
- Gap to previous
- Penalties
- Points
- Status: `Finished`, `DNF`, `DNS`, `DSQ`
- Official source URL

## Source Tracking

Every fetch must prepare:

- `DataSource` for the official timing/results provider
- `SourceSnapshot` for the raw fetched result payload or PDF metadata
- `ImportRun` for the connector execution
- `SourceLink` for relationships between internal result rows and official URLs
- `DataVersion` preview entries for every proposed create or update

Current Step 28 behavior builds source-tracking preview objects for review. Future approval actions can persist these records through the admin review flow.

## Review Workflow

Official results source
-> fetch results
-> save snapshot preview
-> parse result rows
-> normalize timing/classification
-> create diff preview
-> create pending review items
-> admin review
-> approval later
-> update results later
-> recalculate standings/statistics/records later
-> audit log

## Review Scenarios

Imported result rows must become review items for:

- New rider result
- Position change
- Time correction
- Gap correction
- Penalty added
- Status changed to `DNF`, `DNS`, or `DSQ`
- Points changed

## Safety Rules

- No auto publish.
- No direct database update from the connector.
- No standings update.
- No statistics update.
- No records update.
- No history update.
- No rider, team, manufacturer, or motorcycle update.
- Every proposed result change requires admin review.
- Public results continue to read approved database records only.
