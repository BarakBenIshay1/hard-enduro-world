# Architecture

Hard Enduro World is designed as a long-lived championship knowledge base.

The first implementation keeps these boundaries:

- `app/` owns routes and page composition.
- `components/` owns reusable UI.
- `domain/` will own business rules.
- `lib/` owns shared infrastructure helpers.
- `prisma/` owns the database schema and seed data.
- `jobs/` will own ingestion, derived statistics, and AI tasks in later steps.

Raw timing and result records are the source of truth. Derived data such as rider careers, motorcycle history, manufacturer dashboards, comparisons, records, and Hall of Fame entries should be recalculated from raw results after imports or approved manual edits.
