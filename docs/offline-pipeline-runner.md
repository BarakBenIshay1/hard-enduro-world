# Offline Pipeline Runner

The offline pipeline runner is a tiny developer utility for validating the
verified pipeline without external services.

It lives at:

`data/verified/pipeline/run.ts`

## Flow

```text
Input
↓
Adapter
↓
Normalize
↓
Validate
↓
Review
↓
Summary
```

## What It Uses

The runner creates one local in-memory sample:

- one registered source
- one event
- one rider reference
- one overall result

The sample is intentionally small and exists only to prove the pipeline wiring.

## What It Returns

`runOfflineVerifiedPipeline()` returns:

- parsed object counts
- adapter warnings
- validation warnings
- review summary
- coverage summary
- the full pipeline summary object

No JSON files are written.

## Checks Exercised

The runner verifies that:

- every object has a source
- the event slug exists
- the rider slug exists
- result positions are unique
- the source is registered
- source confidence exists

## Strict Boundaries

This is an offline developer test only.

It does not:

- scrape
- fetch
- call HTTP
- call APIs
- use Playwright
- use Supabase
- write to the database
- change seed data
- deploy to Vercel
- render or change UI
