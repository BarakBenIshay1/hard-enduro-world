# Deployment Readiness

Step 24 adds a read-only deployment readiness foundation. It does not deploy the app, connect external providers, or add real secrets.

## Flow

Development
-> Staging
-> Production

## Development

Development runs locally with:

- Next.js dev server
- Docker PostgreSQL
- Docker Redis
- Local `.env`
- Demo seed data
- Mock auth session
- Mock/demo connector data

Development is allowed to use placeholders and preview-only admin pages.

## Staging

Staging should later use:

- Vercel preview or staging project
- Supabase staging PostgreSQL
- Upstash staging Redis
- Dry-run automation
- Protected admin access
- Staging-only environment variables

Staging should verify migrations, admin protection, connector previews, review queue behavior, and deployment settings before production.

## Production

Production should later use:

- Vercel production project
- Supabase production PostgreSQL
- Upstash production Redis
- Real domain and SSL
- Protected admin routes
- Cron protection
- Backups
- Monitoring
- Audit-ready admin actions

Production should not launch until all required blockers are resolved.

## Current Readiness Engine

The readiness engine lives in:

- `lib/deployment/readiness.ts`
- `db/deployment.ts`

It generates preview-only checks for:

- Environment readiness
- Auth readiness
- Database readiness
- Redis readiness
- Automation readiness
- Connector readiness
- Calculation readiness
- Review queue readiness

## Current Admin Pages

- `/admin/system`
  - Shows system status, readiness score, checks, and production blockers.
- `/admin/deployment`
  - Shows launch readiness summary, environment variable checklist, required service checklist, and blockers.

## Remaining Launch Blockers

The current project is intentionally not production-ready until these are resolved:

- Missing real auth provider
- Missing production database confirmation
- Missing production Redis confirmation
- Missing cron protection
- Missing monitoring
- Missing backup confirmation
- Missing real domain and SSL confirmation
- Admin routes are not protected by a real provider yet
- External connectors still use mock/demo data
- Automation and calculation outputs remain preview-only

## Safety Rules

- Do not deploy automatically.
- Do not add real secrets to source control.
- Do not connect external providers until explicitly approved.
- Do not auto-publish connector or recalculation outputs.
- Keep high-risk data behind review and audit workflows.
