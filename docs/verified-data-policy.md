# Verified Data Policy

The public website must prioritize historical accuracy over synthetic completeness.
Verified historical facts live outside the demo/profile seed data in `data/verified/`.

## Where Verified Data Lives

- `data/verified/types.ts` defines the typed contracts.
- `data/verified/events.ts` stores event-level facts such as verified winner,
  finisher count, and source notes.
- `data/verified/results.ts` stores verified overall and stage result rows.
- `data/verified/riders.ts` stores rider participation/source notes when needed.
- `data/verified/sources.ts` stores source metadata used by seed source tracking.

Demo/profile data can make the interface feel populated, but it must not claim
historical results. Verified files are the only place seed-driven historical
results should be added.

## Adding A New Verified Event

1. Add or confirm the event metadata already exists in `prisma/seed.ts`.
2. Add a source entry in `data/verified/sources.ts`.
3. Add event-level facts in `data/verified/events.ts`.
4. Add only confirmed result rows in `data/verified/results.ts`.
5. Leave every unknown result field as `null`.
6. Run the validation suite before publishing the seed change.

Do not add guessed finishing positions, guessed times, guessed gaps, guessed
points, or guessed penalties.

## Unknown Fields

Unknown data must stay empty:

- unknown time: `totalTimeMs: null`, `totalTimeText: null`
- unknown gaps: `gapToLeaderMs: null`, `gapToLeaderText: null`
- unknown points: `points: null`
- unknown penalties: `penaltiesMs: null`
- unknown class position: `classPosition: null`

If a source verifies only a podium, add only those podium rows. If a source says
15 riders finished but names only three in the current verified pass, store the
finisher count as an event fact and do not invent the other twelve rows.

## Synthetic Historical Data Is Forbidden

The seed may contain profile placeholders, media placeholders, source placeholders,
and schedule placeholders. It must not contain fictional history:

- no fictional results
- no fictional stage timing
- no fictional standings
- no fictional records
- no fictional points
- no future seasons without an official source

This keeps the public website trustworthy while the database grows one verified
event at a time.

## Source Tracking

Every verified result supports source metadata:

- source name
- source URL placeholder or official URL
- published date, when known
- confidence level
- notes

The seed converts verified source metadata into source snapshots, source links,
import runs, and data versions. That means every public verified row has a trace
back to the source layer, even when the first pass uses a manual/source-tracked
placeholder.

## Review Rule

Adding verified seed data is allowed only when the fact is known. Future automated
imports must remain review-first:

official source -> snapshot -> parse -> normalize -> validate -> diff -> admin review
-> approval -> database update -> audit log -> public website update
