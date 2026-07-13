# FIM Calendar Connector Dry Run

This connector prepares the first official calendar automation path for Hard
Enduro World.

It is dry-run only. It does not write to the database, update public pages,
modify seed data, import results, import riders, calculate standings, or publish
calendar changes.

## Purpose

The connector compares FIM / Hard Enduro championship calendar source data
against current event data and produces a review-ready report.

The report can identify:

- new event found
- existing event unchanged
- date changed
- country changed
- location changed
- status changed
- official URL changed
- event exists in DB but is missing from source
- ambiguous match requiring review

## Dry-Run Behavior

The connector can read a real official source in dry-run mode:

- official URL from `FIM_CALENDAR_OFFICIAL_URL`
- official URL from the production source registry
- local JSON/ICS/HTML input as a test or fallback mode

- JSON calendar payload text
- ICS calendar payload text
- HTML calendar snapshots with JSON-LD event metadata
- already parsed local calendar item objects

The official fetch path is read-only by default. It does not persist snapshots,
create review rows, write events, or update public pages unless the explicit
review-persistence flag is enabled.

## Developer Command

Run the local dry-run report:

```bash
pnpm run connector:fim-calendar:dry-run
```

The command:

- attempts a read-only official fetch from the configured FIM calendar source
- falls back to `jobs/connectors/fim-calendar/sample-2026-calendar.json` if the official fetch fails
- reads current database events through a read-only helper
- compares source candidates against current events
- prints a console report
- creates review-ready items in memory only
- performs no database writes

The bundled sample is marked as `partial-season`, so it will not recommend
removing unrelated database events that are absent from the sample.

To use a different local JSON/ICS/HTML input file:

```bash
FIM_CALENDAR_INPUT_PATH=/absolute/path/to/local-calendar.json pnpm run connector:fim-calendar:dry-run
```

To target a different season:

```bash
FIM_CALENDAR_SEASON=2025 pnpm run connector:fim-calendar:dry-run
```

To explicitly set coverage behavior:

```bash
FIM_CALENDAR_COVERAGE_MODE=full-season pnpm run connector:fim-calendar:dry-run
FIM_CALENDAR_COVERAGE_MODE=partial-season pnpm run connector:fim-calendar:dry-run
FIM_CALENDAR_COVERAGE_MODE=single-event FIM_CALENDAR_EVENT_SLUG=erzbergrodeo-2026 pnpm run connector:fim-calendar:dry-run
```

To configure a specific official source URL:

```bash
FIM_CALENDAR_OFFICIAL_URL=https://example.com/official-calendar pnpm run connector:fim-calendar:dry-run
```

The report metadata labels successful live reads as `official-fetch`.

Fetch controls:

```bash
FIM_CALENDAR_FETCH_TIMEOUT_MS=8000 pnpm run connector:fim-calendar:dry-run
FIM_CALENDAR_FETCH_RETRIES=2 pnpm run connector:fim-calendar:dry-run
```

If the official fetch fails, the command prints a clear warning and falls back
to the local partial-season fixture. The fallback report is labeled `local-json`.

Run focused deterministic connector tests:

```bash
pnpm run test:fim-calendar
```

Tests use saved fixtures only and never depend on live network access.

If the local database is not reachable, the command prints a warning and
continues with an empty current-event list so the report shape can still be
inspected.

## Internal Snapshot Persistence

The connector can optionally persist an internal synchronization snapshot and
pending review items. This is still not publishing. It is only a durable audit
trail for future human review.

Persistence is disabled by default. Enable it only with:

```bash
FIM_CALENDAR_PERSIST_REVIEW=true pnpm run connector:fim-calendar:dry-run
```

When this flag is absent, the command continues to:

- fetch or load input
- parse and normalize calendar candidates
- compare against current events
- print a report
- update zero public `Event` rows
- create zero database records

When this flag is present, the command additionally:

- creates or reuses one immutable `ConnectorSnapshot`
- creates, reuses, or supersedes `ConnectorReviewItem` rows
- leaves all new review items as `PENDING`
- updates zero public `Event` rows
- performs no approval action

Persistence never becomes enabled simply because `DATABASE_URL` exists.

## Snapshot Purpose

Each persisted snapshot records the exact official-source run that produced a
review package. It stores connector/source keys, requested season, input type,
source URLs, HTTP diagnostics, parser details, record counts, rejection reasons,
normalized event payload, matching payload, diagnostics, execution environment,
optional git commit SHA, connector version, and a deterministic payload
checksum.

Snapshots are immutable. A later connector run creates a new snapshot only when
the normalized official payload materially changes.

The snapshot payload must never contain secrets, cookies, authorization headers,
database credentials, or sensitive environment values.

## Duplicate Snapshot Handling

The connector creates a stable checksum from the normalized event payload. The
checksum ignores execution timestamps, report formatting, local file paths,
random IDs, and JavaScript object insertion order.

If the latest snapshot for the same connector and season has the same checksum,
the connector:

- reuses the existing snapshot id
- marks the run as a duplicate snapshot
- creates no duplicate review items
- reports `Public events updated: 0`

## Review Item Purpose

Review items represent actionable connector findings that may later need human
approval.

Review items are created only for:

- `NEW_EVENT`
- `UPDATE_EVENT`
- `SOURCE_REMOVED`
- `MANUAL_REVIEW`

Review items are not created for unchanged or ignored rows.

Every new review item starts as `PENDING`.

Supported lifecycle statuses:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `SUPERSEDED`

This connector never automatically approves or rejects items. A newer materially
different proposal for the same pending event/action may mark the previous
pending item as `SUPERSEDED` and create a new `PENDING` item. Existing
`APPROVED` and `REJECTED` items are never reopened automatically.

## Review Deduplication

Review item deduplication uses a deterministic key built from the connector,
season, source or matched event identity, suggested action, current values,
proposed values, and changed fields.

If the same pending proposal already exists, the connector reuses it and links
it to the latest snapshot where appropriate. If the proposal changes materially,
the previous pending item is superseded and a new pending item is created.

## Database Requirements

Persistence requires the latest Prisma migration containing the generic
connector snapshot and review item tables:

- `ConnectorSnapshot`
- `ConnectorReviewItem`
- `ConnectorReviewAction`
- `ConnectorReviewStatus`

If persistence is explicitly requested and the database is unavailable, the
command fails with a non-zero exit code. It must not silently continue or report
persistence success.

All persistence runs are wrapped in a transaction. A run stores the snapshot and
review relationships together, or it stores nothing.

## What It Can Collect

Normalized candidates support:

- source event id
- season year
- event name
- slug candidate
- country
- country code
- location
- venue
- start date
- end date
- race status candidate
- official URL
- source id
- confidence
- review requirement
- notes

Unknown values remain `null`.

## What It Cannot Update

The connector must not update:

- events
- seasons
- public race status
- results
- timing
- standings
- riders
- teams
- manufacturers
- motorcycles
- statistics
- records

## Source Registry Usage

The connector only runs when the source exists in the production source registry.

It checks:

- source is registered
- source is enabled
- source supports `calendar`
- source supports `event`
- source supports `season`
- source requires review
- source priority and confidence are available

If authorization fails, the connector returns a safe report with errors and no
rows.

## Source Intelligence Usage

The connector uses Source Intelligence for:

- source registry authorization
- name normalization
- confidence modeling
- review-ready report semantics

Future iterations can add shared Source Intelligence change-set and review-item
objects after the report shape is proven.

## Real Fetch Path

The connector now includes a real official-source fetcher. The fetcher:

- run dry-run first
- uses a connector user-agent
- applies a timeout
- retries transient failures
- returns clear fetch errors
- parses locally after the read completes
- normalize candidates
- compare with existing data
- create review-ready output
- avoid database writes

Suspicious or incomplete official reads are flagged in report warnings. For
example, an official fetch that returns no parseable calendar events is treated
as incomplete and must not be used for removal decisions.

## Official FIM Calendar Endpoint

The FIM sport detail page is a server-rendered TYPO3 page. The visible page does
not contain the calendar rows directly. It exposes an AJAX tab URL on the
`#championship-calendar` element through `data-url`.

Discovery entrypoint:

```text
GET https://www.fim-moto.com/en/sports/view/fim-hard-enduro-world-championship-5410
```

Discovered calendar endpoint pattern:

```text
GET https://www.fim-moto.com/en/calendars
```

Required query parameters:

```text
tx_solr[facet]=year
tx_solr[filter][timeless]=timeless:521
tx_solr[filter][year]=year:{season}
tx_solr[q]=
tx_solr[view]=event
type=1767885145
```

Request headers:

```text
Accept: text/calendar, application/json, text/html, application/ld+json, */*;q=0.8
User-Agent: HardEnduroWorld/1.0 FIMCalendarDryRun (...)
Referer: official sport detail page
X-Requested-With: XMLHttpRequest
```

Observed response:

```text
HTTP 200
Content-Type: text/plain;charset=UTF-8
Body: HTML fragment containing a .fim-table.solr-table event calendar
```

Pagination:

- A specific season request for 2026 currently returns all detected Hard Enduro
  rows in one fragment.
- The unfiltered endpoint can include pagination, so full historical imports
  must inspect pagination before treating coverage as complete.

Scope filters:

- `timeless:521` identifies the main FIM Hard Enduro World Championship source.
- `timeless:572` appears on the Junior class page and is not used by this
  connector.
- The parser only accepts rows whose title contains `FIM Hard Enduro World
Championship`.

## Review Queue Path

Report rows with actionable comparison outcomes can now become durable internal
review items when persistence is explicitly enabled. Admin approval remains
separate from connector execution and does not apply public event changes.

## Admin Review Workflow

FIM Calendar review items can be inspected internally at `/admin/review`.

The review list is protected by the existing admin authorization layer and shows:

- connector key
- season
- event name
- suggested action
- confidence
- matching strategy
- review status
- snapshot timestamp
- created and updated timestamps

Each item has a detail page with side-by-side current and proposed values,
changed-field highlighting, snapshot diagnostics, checksum, official source URL,
recommendation, and decision audit history.

## Approval Behavior

Authorized admins with `review:approve` permission can approve a `PENDING`
review item. Approval:

- changes only the review item status to `APPROVED`
- records the acting admin
- records the decision timestamp
- stores an optional admin note
- creates a `DataVersion` audit entry
- updates zero public `Event` rows
- publishes nothing

Approval requires the expected current status and version. Repeated or stale
approval attempts fail as conflicts.

## Rejection Behavior

Authorized admins with `review:approve` permission can reject a `PENDING` review
item. Rejection:

- changes only the review item status to `REJECTED`
- records the acting admin
- records the decision timestamp
- requires a rejection reason
- creates a `DataVersion` audit entry
- updates zero public `Event` rows
- publishes nothing

## Superseded Behavior

`SUPERSEDED` items are read-only. They remain visible as history and cannot be
approved or rejected. A newer connector snapshot may supersede an older pending
proposal, but approved and rejected items are never reopened automatically.

## Authorization Requirements

All review list, detail, approval, and rejection paths are admin-only. The UI
does not expose review data publicly, and server actions enforce permissions
again on direct submission. Hidden buttons are not treated as security.

## Audit Trail

Every approval or rejection writes a `DataVersion` audit entry with:

- actor id
- previous status and version
- new status and version
- connector key
- season
- suggested action
- snapshot id
- snapshot checksum
- decision note
- source URL when available

Do not log secrets, cookies, authorization headers, or database connection
details.

## Future Approval Path

Only after a later apply step is implemented should approved calendar changes
write to the public event database. Approved writes must create audit/version
history and source links.

During this stage, the connector never inserts, updates, deletes, or publishes
public calendar events.
