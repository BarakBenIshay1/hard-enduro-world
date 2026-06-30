# Verified 2022-2026 Data Plan

This plan limits verified historical coverage to the 2022, 2023, 2024, 2025,
and 2026 championship seasons. We are not building a 2000-2026 archive now,
because a smaller verified scope keeps the platform reliable, manageable, and
free of empty or invented history.

## Target Seasons

- 2022: completed season, needs official results and standings verification.
- 2023: completed season, needs official results and standings verification.
- 2024: completed season, needs official results and standings verification.
- 2025: completed season, needs official results and standings verification.
- 2026: active season. Completed events can receive verified results; future
  events must remain metadata/schedule only until official classifications exist.

No 2027 season, event, result, standing, statistic, or record data should be
added without an official source and a separate approval step.

## Coverage Matrix Source

The typed coverage matrix lives in:

`data/verified/coverage.ts`

It tracks each target event with:

- season
- event slug
- event name
- country
- status
- event metadata coverage
- overall results coverage
- stage results coverage
- standings impact coverage
- source-link coverage
- confidence
- needed result types
- required sources
- priority
- notes

The current matrix is planning-only. It does not add new result rows.

## Events By Season

### 2026

Completed or active events currently in scope:

- Minus 400 2026
- Valleys Hard Enduro 2026
- XL Lagares 2026
- Red Bull Erzbergrodeo 2026
- Abestone Hard Enduro 2026

Scheduled metadata-only events currently in scope:

- Red Bull Romaniacs 2026
- Xross Hard Enduro 2026
- Red Bull Outliers 2026
- Tennessee Knockout 2026
- Sea to Sky 2026
- Hixpania Hard Enduro 2026
- GetzenRodeo 2026
- Roof of Africa 2026
- Wildwood Rock Extreme 2026
- Terra Inferno 2026

Only Red Bull Erzbergrodeo 2026 currently has verified first-pass public result
rows: podium only, plus a verified finisher count. Full timing, points, stage
results, DNS/DNF/DSQ, and complete finisher rows still need source verification.

### 2025

Events currently in scope:

- Minus 400 2025
- Valleys Hard Enduro 2025
- XL Lagares 2025
- Erzbergrodeo 2025
- Red Bull Romaniacs 2025
- Abestone Hard Enduro 2025
- Xross Hard Enduro 2025
- Red Bull Outliers 2025
- Tennessee Knockout 2025
- Sea to Sky 2025
- Hixpania Hard Enduro 2025
- GetzenRodeo 2025
- Roof of Africa 2025
- Battle of Vikings 2025
- King of the Motos 2025

All 2025 result data remains pending source verification.

### 2024

Events currently in scope:

- Minus 400 2024
- Valleys Hard Enduro 2024
- XL Lagares 2024
- Erzbergrodeo 2024
- Red Bull Romaniacs 2024
- Abestone Hard Enduro 2024
- Xross Hard Enduro 2024
- Tennessee Knockout 2024
- Hixpania Hard Enduro 2024
- Sea to Sky 2024
- GetzenRodeo 2024
- Roof of Africa 2024
- Wildwood Rock Extreme 2024

All 2024 result data remains pending source verification.

### 2023

Events currently in scope:

- XL Lagares 2023
- Alestrem 2023
- Erzbergrodeo 2023
- Red Bull Romaniacs 2023
- Sea to Sky 2023
- Hixpania Hard Enduro 2023
- GetzenRodeo 2023
- Roof of Africa 2023
- Battle of Vikings 2023
- Carpathian Hard Enduro 2023

All 2023 result data remains pending source verification.

### 2022

Events currently in scope:

- Alestrem 2022
- XL Lagares 2022
- Erzbergrodeo 2022
- Red Bull Romaniacs 2022
- Sea to Sky 2022
- Hixpania Hard Enduro 2022
- GetzenRodeo 2022
- Roof of Africa 2022
- Slovak Hard Enduro 2022
- Hellas Extreme 2022

All 2022 result data remains pending source verification.

## Needed Result Types

For every completed event, verify these in order:

1. Overall results
2. Finishers
3. DNS/DNF/DSQ statuses
4. Points
5. Stage results
6. Standings impact

Unknown fields must stay null. Do not infer timing gaps, penalties, or points.

## Required Sources

Use source-backed evidence only:

- official FIM Hard Enduro results
- official event timing/classification PDFs
- official event website result pages
- official championship standings updates
- source-tracked manual verification notes when official data is not yet
  integrated but a fact has been deliberately reviewed

Unofficial summaries can help discovery, but should not be treated as the source
of truth for public results.

## Priority Order

1. Finish Red Bull Erzbergrodeo 2026:
   complete finisher list, timing, DNS/DNF/DSQ, and source links.
2. Add completed 2026 events one at a time:
   Minus 400, Valleys Hard Enduro, XL Lagares, Abestone Hard Enduro.
3. Add 2025 championship events from official season sources.
4. Add 2024 championship events from official season sources.
5. Add 2023 championship events from official season sources.
6. Add 2022 championship events from official season sources.
7. Recalculate standings/statistics/records only after result data is verified
   and approved.

## Current Coverage Summary

Use `getVerifiedCoverageSummary()` from `data/verified/coverage.ts` for a
read-only developer summary:

- total target seasons
- total target events
- verified events
- missing overall results
- missing stage results
- missing source links

This summary is intentionally not an admin feature yet. It is a developer utility
for safe planning before more verified data is added.

## Non-Negotiable Rules

- Do not add fictional data.
- Do not add 2027.
- Do not auto-publish imported data.
- Do not add unverified results.
- Do not create fake standings, stage timing, records, or statistics.
- Do not build a 2000-2026 archive in this phase.
