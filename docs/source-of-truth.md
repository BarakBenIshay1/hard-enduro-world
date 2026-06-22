# Source of Truth

Step 25 defines where each category of Hard Enduro World data should come from before real integrations begin.

## Purpose

The platform should not treat every source equally. Official timing, official calendars, reviewed admin edits, and derived calculations all have different trust levels.

The source map centralizes:

- What each data type means
- Where it should come from
- What can be automated
- What must be reviewed
- What should never be directly imported

## Data Types

- Events calendar
  - Official championship calendar or FIM calendar.
  - Can be automated through the official events connector.
  - Requires review before public changes.
- Event details
  - Official event pages and FIM event listings.
  - Requires source links and review.
- Riders
  - Manual/admin records plus reviewed official sources.
  - Should not be blindly automated.
- Teams
  - Manual/admin records plus reviewed official sources.
  - Team changes should be audited by season.
- Manufacturers
  - Manual/admin records plus reviewed official manufacturer/championship sources.
  - Stable data, but still needs source discipline.
- Motorcycles
  - Manual/admin records plus reviewed official manufacturer specifications.
  - Specs and usage history need attribution.
- Results
  - Official timing or FIM results.
  - High-risk data. Never auto-publish.
- Stage timing
  - Official timing tables and official PDFs.
  - Every row, gap, penalty, and status must be preserved.
- Standings
  - Derived from approved results through the calculation engine.
  - Should not be directly imported as source of truth.
- Statistics
  - Derived from approved results and reviewed standings.
  - Should not be directly imported as source of truth.
- Records
  - Derived from approved results, statistics, and verified history.
  - Requires complete historical context before publishing.
- Videos
  - Official YouTube channels and reviewed official media sources.
  - Low risk, but still source-tracked.
- Weather
  - Weather provider snapshots tied to event/time.
  - Can be automated later.
- Track maps
  - Official event maps and verified organizer documents.
  - Must preserve licensing and attribution.
- Documents / PDFs
  - Official source links and archives.
  - Must preserve provider, source URL, license, and upload date.

## Automation Rules

Can be automated with review:

- Events calendar
- Event details
- Results
- Stage timing
- Videos
- Documents / PDFs

Can be automated as derived calculations:

- Standings
- Statistics
- Records

Should stay manual or reviewed-admin first:

- Riders
- Teams
- Manufacturers
- Motorcycles
- Track maps

## Conflict Rules

- Official source beats unofficial source.
- Manual admin correction requires an audit note.
- High-risk data always requires review.
- Results never auto-publish.
- Standings, statistics, and records are derived, not directly imported.

## Never Directly Import

These should be derived from approved results instead of imported as source-of-truth records:

- Standings
- Statistics
- Records

Official standings or record pages can be used for verification, but the platform should calculate its own values from approved results so every number remains explainable.

## Current Implementation

- Source map rules live in `lib/sources/source-map.ts`.
- Read access lives in `db/source-map.ts`.
- Admin view lives at `/admin/sources-map`.
