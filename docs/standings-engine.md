# Standings Recalculation Foundation

Step 20 adds the preview-only calculation foundation for future championship standings.

The engine is designed to eventually transform approved race results into rider points, manufacturer points, team points, and season rankings. It does not publish data, mutate standings, recalculate statistics, or update records in this step.

## Future Flow

Approved results
-> points allocation
-> standings calculation
-> validation
-> review
-> publish

## Current Modules

- `jobs/calculations/points-system.ts`
  - Defines typed points systems for FIM style, legacy style, and custom style.
  - Provides point allocation helpers.
- `jobs/calculations/validation.ts`
  - Prepares validation checks for duplicate rider results, duplicate event results, missing points, invalid positions, and missing riders.
- `jobs/calculations/season-ranking.ts`
  - Aggregates result rows into season ranking previews.
- `jobs/calculations/standings-engine.ts`
  - Compares current standings with proposed standings in memory.
- `db/calculations.ts`
  - Loads current demo data and produces an admin preview without writing to the database.
- `/admin/calculations`
  - Shows last calculation run, pending recalculations, affected seasons, result imports pending review, validation issues, points systems, and standings preview.

## Safety Rules

- No auto publish.
- No database mutation.
- No standings table update.
- No statistics or records recalculation.
- No external website calls.
- No unapproved result rows should feed a production publish action.

## Future Publish Model

In production, the calculation engine should only run against approved official results. High-risk outputs should be reviewed before publication.

```text
Approved Result Rows
  |
  v
Points System Selection
  |
  v
Season Ranking Preview
  |
  v
Validation Checks
  |
  v
Admin Review
  |
  v
Publish Standings
  |
  v
Audit Log + Public Standings Update
```

Manufacturer, team, motorcycle, statistics, and records recalculations should be separate downstream jobs so each output can be reviewed and audited independently.
