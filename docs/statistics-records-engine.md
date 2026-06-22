# Statistics and Records Recalculation Foundation

Step 21 adds the preview-only calculation foundation for future championship statistics and records.

The engine is designed to eventually recalculate derived knowledge-base data from approved results and reviewed standings. It does not publish data, mutate statistics, update records, or call external websites in this step.

## Future Flow

Approved results
-> standings calculation
-> statistics calculation
-> records calculation
-> validation
-> admin review
-> publish later
-> audit log

## Current Modules

- `jobs/calculations/statistics-engine.ts`
  - Calculates preview-only rider wins, podiums, starts, DNFs, finish rate, average finish position, manufacturer wins/podiums, motorcycle wins/podiums, country wins, and team wins.
- `jobs/calculations/records-engine.ts`
  - Converts statistics previews and championship markers into preview-only record candidates.
- `jobs/calculations/leaderboards.ts`
  - Shared leaderboard aggregation helpers.
- `jobs/calculations/record-validation.ts`
  - Prepares validation checks for missing result rows, duplicated results, invalid podium calculation, missing rider/manufacturer/motorcycle links, and inconsistent DNF/DNS statuses.
- `db/recalculation.ts`
  - Loads current demo data and produces preview outputs without database writes.
- `/admin/recalculation`
  - Shows statistics preview, records preview, last run placeholder, pending recalculation items, validation warnings, what would change, and review-required notices.

## Preview Statistics

The current preview supports:

- Rider wins
- Rider podiums
- Rider starts
- Rider DNFs
- Finish rate
- Average finish position
- Manufacturer wins
- Manufacturer podiums
- Motorcycle wins
- Motorcycle podiums
- Country wins
- Team wins

## Preview Records

The current preview supports:

- Most wins
- Most podiums
- Most championships
- Most starts
- Most DNFs
- Most successful manufacturer
- Most successful motorcycle
- Most successful country
- Longest winning streak placeholder
- Youngest winner placeholder
- Oldest winner placeholder

## Safety Rules

- No auto publish.
- No database mutation.
- No statistics table update.
- No championship record update.
- No external website calls.
- All recalculation outputs are review-only previews.

## Future Publish Model

```text
Approved Results
  |
  v
Reviewed Standings Calculation
  |
  v
Statistics Preview
  |
  v
Records Preview
  |
  v
Validation Warnings
  |
  v
Admin Review
  |
  v
Publish Later
  |
  v
Audit Log + Public Website Update
```

Statistics and records should remain downstream derived data. The platform should always preserve source tracking and audit history for the approved result rows that produced them.
