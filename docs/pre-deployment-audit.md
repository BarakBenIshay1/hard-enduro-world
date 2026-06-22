# Pre-Deployment Audit

Step 30 adds a read-only preflight audit before the first Vercel deployment. It does
not deploy the app, connect external services, publish imported data, or add secrets.

## Where To Access It

```text
/admin/preflight
```

The page is no-indexed and lives inside the protected admin shell.

## What Was Checked

The preflight audit checks:

- Build status readiness
- Environment variable presence
- Admin auth readiness
- Database readiness
- Supabase readiness
- Redis readiness
- Connector safety
- No auto-publish rules
- Sitemap readiness
- Robots readiness
- SEO readiness
- Secret hygiene
- Production blockers

## Route Audit

The route inventory is centralized in:

```text
lib/preflight/route-inventory.ts
```

It classifies routes as:

- Public
- Admin protected
- Connector admin
- Dynamic
- SEO-indexable
- No-index

Public routes are intended for search engines. Admin routes are marked no-index and
are protected by the Supabase-ready admin shell when Supabase is configured.

## Safety Audit

The safety audit is centralized in:

```text
lib/preflight/safety-audit.ts
```

Verified safety rules:

- Results connector does not auto-publish.
- Events connector does not auto-publish.
- YouTube connector does not auto-publish.
- Standings, statistics, and records calculations are preview-only.
- Admin routes require Supabase authentication when Supabase is configured.
- `.env` and `.env*.local` are ignored.
- `.env.example` contains placeholders only.

## Safe To Deploy As Preview

The project is safe for a Vercel preview deployment when:

- Local validation passes.
- `.env` remains uncommitted.
- Preview environment variables are placeholders or safe preview values.
- Connector outputs remain in admin preview/review surfaces.
- No automation job is configured to publish data automatically.

Preview deployment can be used to inspect:

- Public pages
- Admin foundation
- Source tracking UI
- Review queue UI
- Connector preview pages
- Calculation preview pages
- Route and safety audit pages

## Still Blocking Production

Production launch still requires:

- Real Supabase project configuration.
- Supabase Auth provider setup.
- Production Supabase PostgreSQL connection.
- Upstash Redis or equivalent production cache.
- Cron protection secret.
- Monitoring.
- Database backups.
- Domain and SSL setup.
- Final review of robots, sitemap, and canonical URLs.
- Real admin user profile records.
- Approval workflows before any imported data can publish.

## Must Not Be Enabled Yet

Do not enable these before explicit future steps:

- Automatic result publishing.
- Automatic standings updates.
- Automatic statistics or records updates.
- Unreviewed event calendar publishing.
- Unreviewed video publishing.
- Real FIM/results provider mutation flows.
- Production cron jobs that mutate public data.

## Operational Rule

External data must continue to follow the trusted import flow:

```text
Official source
-> fetch
-> snapshot
-> parse
-> normalize
-> validate
-> diff
-> admin review
-> approval
-> database update
-> audit log
-> public website update
```

Until approval actions are implemented, imported connector output must stay in preview
and review-only admin surfaces.
