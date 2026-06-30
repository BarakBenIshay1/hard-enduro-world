# Verified Import Pipeline

The verified import pipeline is an internal foundation for turning source-specific
historical data into review-ready verified records. It does not fetch external
sources, approve changes, publish data, or mutate the database.

## Flow

```text
Source data
-> intake
-> normalize
-> validate
-> review package
-> seed/database later
```

The pipeline is review-first. Every proposed result must carry source metadata,
and unknown fields must stay `null`.

## Modules

`data/verified/pipeline/intake.ts`

Defines source-specific incoming data structures for:

- official HTML pages
- official PDF metadata
- CSV/timing exports
- manually verified source notes

`data/verified/pipeline/normalize.ts`

Converts intake records into the existing verified data layer:

- verified event facts
- verified rider references
- verified overall results
- verified stage results
- verified source references

Normalization does not infer missing values. Optional intake fields become `null`
when unknown.

`data/verified/pipeline/validate.ts`

Returns warnings/errors only. It does not mutate data.

Current checks include:

- missing source reference
- missing event slug
- duplicate result position
- duplicate rider in the same event
- result row without source coverage
- low-confidence source warning
- 2027 or later data blocked unless explicitly handled as official future
  calendar metadata

`data/verified/pipeline/review.ts`

Builds review-ready objects showing:

- what would be added
- what would be updated later
- what is missing
- what needs manual verification
- source confidence
- notes

Approval mutations are intentionally not implemented.

`data/verified/pipeline/summary.ts`

Runs an intake package through normalization, validation, review packaging, and
coverage summary generation. This is a developer utility for safe inspection.

## Coverage Summary

`data/verified/coverage.ts` tracks the 2022-2026 verified data plan. Its summary
now includes:

- verified events
- events missing overall results
- events missing stage results
- source coverage
- confidence distribution
- next recommended verification targets

## Rules

- Do not add fictional data.
- Do not add 2027 result data.
- Do not auto-publish anything.
- Do not import unverified results.
- Do not infer timing, gaps, penalties, points, finishers, DNS/DNF/DSQ, or
  standings.
- Keep the existing Red Bull Erzbergrodeo 2026 verified podium intact.

## Future Use

Future source-specific parsers should output `VerifiedIntakePackage` objects.
The parser output should then be normalized, validated, and converted into a
review package. Only after manual approval should a later step persist data into
seed files or database tables.
