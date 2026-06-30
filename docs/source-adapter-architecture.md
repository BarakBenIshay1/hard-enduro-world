# Source Adapter Architecture

Official source adapters isolate every source before it reaches the verified
pipeline. This keeps parsing rules source-specific, review-first, and safer to
extend.

## Flow

```text
Registry
↓
Adapter
↓
Pipeline
↓
Review
↓
Verified Data
↓
Database
```

## Layers

### Registry

`data/verified/source-registry.ts` defines allowed official and trusted sources.
Each source declares:

- source id
- source type
- base URL or channel URL
- allowed data types
- trust level
- review requirement
- notes

Unknown, unofficial, fan, random blog, or unsourced sources are excluded.

### Adapter

`data/verified/adapters/` defines the adapter contract and placeholder registry.
Future adapters include:

- `FIMAdapter`
- `RedBullAdapter`
- `ErzbergrodeoAdapter`
- `RomaniacsAdapter`
- `SeaToSkyAdapter`
- `USHardEnduroAdapter`
- `OfficialPDFAdapter`
- `OfficialCSVAdapter`
- `MediaAdapter`

Each adapter can eventually parse only the data types allowed by its registered
source. Current adapters are placeholders and return empty typed records.

### Pipeline

Adapters will eventually output verified intake packages. The existing verified
pipeline then:

1. normalizes source-specific input
2. validates source, event, rider, result, stage, and data-type rules
3. builds review-ready records
4. reports coverage and next verification targets

### Review

Every source-derived fact remains review-required. The adapter layer never
approves, publishes, or writes official facts.

### Verified Data

Only reviewed data should enter `data/verified/` or the database. Unknown fields
remain `null`; the system must not infer times, gaps, penalties, points,
standings, DNS/DNF/DSQ status, or results.

## Guardrails

- Only registered adapters may enter the pipeline.
- Unsupported source ids produce errors.
- Unsupported source/data-type combinations produce errors.
- Media adapters cannot create official results.
- Document adapters cannot create standings directly.
- Timing adapters cannot create media.
- No adapters fetch external websites yet.
- No adapters scrape pages yet.
- No adapters call APIs yet.
- No adapters mutate seed or database state.

## Why Sources Stay Isolated

Every official source has different formats, publication timing, naming
conventions, and update behavior. Isolating sources keeps parser risk contained:
one event source can be upgraded without changing the FIM parser, media parser,
or timing export parser.
