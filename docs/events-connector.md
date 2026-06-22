# Official Events Connector Foundation

Step 18 introduces the calendar-only connector foundation for official event metadata. It is intentionally limited to event name, season, dates, country, location, status, and official URL.

This connector does not import race results, stage timing, points, standings, records, or statistics.

## Future Flow

Official calendar source
-> fetch calendar
-> save snapshot
-> parse events
-> normalize event metadata
-> create pending review
-> admin approval
-> publish to `/events`

## Source Tracking

No event metadata should bypass source tracking. A future production run should create or reuse:

- `DataSource` for the official calendar provider
- `SourceSnapshot` for the raw fetched calendar payload
- `ImportRun` for the connector execution
- `SourceLink` for relationships between imported records and official URLs
- `DataVersion` entries for every proposed create or update

## Review Scenarios

The review queue should be prepared to show:

- New event found
- Event date changed
- Event country changed
- Event location changed
- Event status changed
- Official URL changed

## Current Step 18 Behavior

The connector uses mock/demo data only. No external websites are called, and all normalized events become preview rows and diff placeholders for future admin review.
