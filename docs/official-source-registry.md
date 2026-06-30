# Official Source Registry

The verified data system accepts official or trusted championship/event sources
only. Random blogs, fan pages, forum posts, and unsourced data must not be used
as verified historical facts.

The central registry lives in:

`data/verified/source-registry.ts`

## Allowed Source Groups

Primary official sources:

- FIM official sources
- Red Bull official sources
- Red Bull Erzbergrodeo official sources
- Red Bull Romaniacs official sources
- Sea to Sky official sources
- US Hard Enduro official sources
- official event PDFs
- official CSV/timing exports

Trusted media/video sources:

- `https://www.youtube.com/@RedBullMotorsports`
- `http://youtube.com/@ushardenduro`
- `https://www.youtube.com/@RBRomaniacs`
- `https://www.youtube.com/@Seatosky_Official`
- `https://www.youtube.com/@2PRO1SLOW`
- `https://www.youtube.com/@endurolifecom`

## Source Types

- `official`: official championship, organizer, or event website.
- `official-document`: official PDF or document source.
- `official-timing`: official timing or CSV export source.
- `trusted-media`: trusted media/video source.

## Trust Levels

- `primary`: can support official facts for its allowed data types.
- `secondary`: useful for context, media, documents, or event information, but
  should not override primary timing/classification sources.
- `media-only`: can create media references only.

## Allowed Data Types

Sources declare exactly what they may provide:

- `events`
- `results`
- `standings`
- `media`
- `documents`
- `timing`

Media-only sources cannot create official results, standings, timing rows,
statistics, records, or championship history.

## Review Requirement

Every registry entry has `requiresReview: true`.

This means source-derived data must still pass:

```text
source -> intake -> normalize -> validate -> review package -> approval later
```

The registry does not auto-publish anything.

## Pipeline Enforcement

The verified import pipeline validation checks:

- source id exists in the registry
- referenced source exists in the intake package
- source is allowed for the requested data type
- media-only source cannot create official results or timing
- all source-derived facts remain review-required

## Adding A New Official Source

1. Confirm the source is official or trusted.
2. Add a registry entry in `data/verified/source-registry.ts`.
3. Choose the narrowest possible `allowedDataTypes`.
4. Set `requiresReview: true`.
5. Add notes explaining exactly how the source may be used.
6. Do not use the source for public facts until parser output passes validation
   and manual review.

## Excluded Sources

Do not use:

- random blogs
- fan pages
- forum posts
- social reposts without official source links
- unsourced spreadsheets
- copied timing tables without official origin

Those sources may help discovery, but they are not verified fact sources.
