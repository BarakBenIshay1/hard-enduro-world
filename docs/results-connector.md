# Official Results Connector Foundation

Step 19 adds the high-risk connector foundation for official race results. It uses mock/demo data only and does not call real external websites.

This connector must never auto-publish. Results, stage timing, points, standings, statistics, records, and history must not change until an authorized admin review flow approves the proposed changes.

## Future Flow

Official results source
-> fetch results
-> save snapshot
-> parse result rows
-> normalize timing/classification
-> validate
-> diff
-> admin review
-> approval
-> update results
-> recalculate standings/statistics/records later
-> audit log

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

No result data should bypass source tracking. A future production import should create or reuse:

- `DataSource` for the official timing/results provider
- `SourceSnapshot` for the raw fetched result payload
- `ImportRun` for the connector execution
- `SourceLink` for relationships between internal result rows and official URLs
- `DataVersion` placeholders for every proposed create or update

## Review Scenarios

The review queue should be prepared to show:

- New result row found
- Position changed
- Time changed
- Gap changed
- Penalty added
- Rider status changed to `DNF`, `DNS`, or `DSQ`
- Points changed

## Current Step 19 Behavior

- `jobs/connectors/results/` contains typed connector placeholders.
- The demo fetcher returns sample official result rows.
- The parser and normalizer prepare timing/classification preview payloads.
- The automation registry links `official-results` to the connector path.
- `/admin/jobs/official-results` shows source tracking, sample results, normalized rows, and diff preview.
- Seed data includes demo import runs and `DataVersion` review scenarios.

## Safety Rules

- No auto publish.
- No direct database update from the connector.
- No standings recalculation yet.
- No statistics or records recalculation yet.
- Every proposed change requires admin review.
- Every proposed change must preserve source tracking and audit history.
