# HTML Adapter Design

The official HTML adapter prepares the project for future official web page
parsing without fetching, scraping, or calling external services now.

## Flow

```text
HTML source
↓
Parser
↓
Selectors
↓
Mapping
↓
Validation
↓
Verified Pipeline
↓
Review
```

## Source

The adapter may only be used with source ids registered in
`data/verified/source-registry.ts`.

Official HTML sources include FIM, Red Bull, Red Bull Erzbergrodeo, Red Bull
Romaniacs, Sea to Sky, and US Hard Enduro official websites. Trusted media
sources remain media-only and cannot create official results.

## Parser

`data/verified/adapters/html/parser.ts` defines a typed
`ParsedOfficialHtmlDocument`.

Future parser implementations can fill that model from official pages. This step
does not implement page download, DOM parsing, scraping, Playwright, browser
automation, HTTP, or APIs.

## Selectors

`data/verified/adapters/html/selectors.ts` stores selector definitions that future
source-specific parsers can use. Selectors are configuration, not scraping logic.

## Mapping

`data/verified/adapters/html/mapping.ts` converts parsed HTML objects into
existing verified objects:

- event facts
- rider references
- overall results
- stage results
- standings rows
- documents
- media references
- source references

Unknown values remain `null`. The mapping layer must never infer times, gaps,
points, penalties, standings, or missing rider rows.

## Validation

`data/verified/adapters/html/validation.ts` rejects:

- missing event ids
- missing source references
- duplicate riders in a result set
- duplicate finishing positions
- future seasons without explicit official handling
- unknown source ids

The adapter still feeds the shared verified pipeline validation afterwards.

## Why Parsing Stays Isolated

Official sources publish different HTML structures. Keeping parsing isolated
means a change in one source does not affect the verified data model, review
queue, calculations, or public website. The adapter boundary lets each source be
upgraded independently while the verified pipeline stays stable.

## Review First

The HTML adapter only prepares review-ready data. It does not approve, publish,
seed, or write database records.
