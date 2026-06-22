# Official Events Connector

Step 27 upgrades the official events calendar connector foundation to support real calendar metadata imports while preserving review-first publishing.

This connector is limited to event metadata only. It must not import results, stage timing, standings, points, records, or statistics.

## Environment Configuration

Use the placeholder in `.env.example`:

- `OFFICIAL_EVENTS_URL=`

No real secrets are required. The URL should point to an official championship/FIM/event calendar source when configured later.

If `OFFICIAL_EVENTS_URL` is missing, the connector uses safe demo fallback data and marks the connector status as `demo-fallback` / `missing-config`.

## Supported Fields

The normalized import preview supports:

- Event name
- Season
- Country
- Location
- Start date
- End date
- Status
- Official URL

## Supported Payloads

The parser is modular and prepared for:

- JSON array payloads
- JSON objects with an `events` array
- Basic iCalendar-style payloads

Future source-specific parsers can be added without changing the review workflow.

## Source Tracking

Every import must prepare:

- `DataSource`
- `SourceSnapshot`
- `ImportRun`
- `SourceLink`
- `DataVersion` preview

Current Step 27 behavior builds source-tracking preview objects for review. Future approval actions can persist these records through the admin review flow.

## Review Workflow

Official calendar source
-> fetch calendar
-> save snapshot preview
-> parse events
-> normalize event metadata
-> create diff preview
-> create pending review items
-> admin review
-> approval later
-> publish to `/events`

## Review Scenarios

The review queue should show:

- New event found
- Event date changed
- Event country changed
- Event location changed
- Event status changed
- Official URL changed

## Safety Rules

- No auto publish.
- No results import.
- No stage timing import.
- No standings import.
- No statistics or records recalculation.
- Every proposed event create/update requires admin review.
- Public `/events` continues to read approved database event records only.
