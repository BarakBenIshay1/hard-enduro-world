# Official HTML Adapter

This adapter defines how official HTML source data will be interpreted after a
future source-specific parser provides a typed document model.

It does not:

- fetch external websites
- scrape HTML
- use browser automation
- call APIs
- write seed data
- write database rows

## Files

- `adapter.ts`: offline adapter implementation.
- `parser.ts`: typed parsed HTML document model.
- `selectors.ts`: selector configuration for future parser implementations.
- `mapping.ts`: maps parsed HTML objects into verified pipeline objects.
- `validation.ts`: adapter-level validation for parsed HTML documents.

## Flow

```text
official HTML source
-> future parser fills ParsedOfficialHtmlDocument
-> mapping
-> adapter validation
-> verified pipeline
-> review
```

Unknown values stay `null`; missing rows are not invented.
