# Caching

The read path is:

```text
Client -> Next.js -> Redis / Upstash -> PostgreSQL
```

Cache candidates:

- Current standings.
- Event result pages.
- Rider profiles.
- Rider career pages.
- Motorcycle history pages.
- Manufacturer dashboards.
- Hall of Fame pages.
- Statistics datasets.

Cache invalidation should happen after imports, approved admin edits, and derived-stat recalculation.
