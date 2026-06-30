# Verified Source Adapters

This folder defines placeholder adapters for official and trusted sources.

Adapters are intentionally isolated from fetching, scraping, browser automation,
API calls, database writes, and seed mutation. A future approved step can replace
placeholder parser methods with source-specific parsers.

## Files

- `base.ts`: shared adapter interface and placeholder implementation.
- `registry.ts`: maps official source registry entries to adapter placeholders.
- `factory.ts`: returns a registered adapter for a source id, source type, trust
  level, and requested data type.

## Flow

```text
official source registry
-> adapter factory
-> source-specific adapter
-> verified intake package
-> normalize
-> validate
-> review package
```

No adapter may bypass review.
