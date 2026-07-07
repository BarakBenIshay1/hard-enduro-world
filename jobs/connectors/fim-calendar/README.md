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

The connector accepts local source input:

- JSON calendar payload text
- ICS calendar payload text
- already parsed local calendar item objects

If no local source input is provided, the connector returns a safe empty report
with a warning. It does not fetch a real source in this sprint.

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

## Future Real Fetch Path

A later sprint may add a fetcher that reads a configured official calendar URL.
That fetcher must still:

- run dry-run first
- create a source snapshot
- parse locally
- normalize candidates
- compare with existing data
- create review-ready output
- avoid database writes

## Future Review Queue Path

Report rows with `review-required` severity can later be converted into durable
review items.

Approval must remain separate from connector execution.

## Future Approval Path

Only after review infrastructure is implemented should approved calendar changes
write to the database. Approved writes must create audit/version history and
source links.
