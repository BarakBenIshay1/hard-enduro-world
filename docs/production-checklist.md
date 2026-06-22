# Production Checklist

This checklist prepares Hard Enduro World for a future Vercel + Supabase deployment. It does not deploy the app yet.

## Environment Strategy

### Local Development

- App: Next.js running locally with `pnpm run dev`
- Database: Docker PostgreSQL
- Cache: Docker Redis
- Data: local seed/demo data
- Secrets: local `.env`, never committed

### Staging

- App: Vercel preview or staging project
- Database: Supabase staging PostgreSQL project
- Cache: Upstash Redis staging database
- Data: controlled staging seed or sanitized copy
- Purpose: verify migrations, admin workflows, connector previews, and deployment settings before production

### Production

- App: Vercel production project
- Database: Supabase PostgreSQL production project
- Cache: Upstash Redis production database
- Data: approved production data only
- Purpose: public website, protected admin, reviewed automation, audited changes

## Vercel Setup

- Connect the GitHub repository to Vercel.
- Use the `main` branch for production only after review.
- Confirm the build command is `pnpm run build`.
- Confirm the install command uses pnpm.
- Set `NEXT_PUBLIC_SITE_URL` to the production domain.
- Add environment variables in Vercel Project Settings.
- Do not paste secrets into source files.

## Supabase Setup

- Create separate staging and production Supabase projects.
- Store Supabase PostgreSQL connection strings in Vercel environment variables.
- Keep service role keys server-only.
- Enable backups before launch.
- Configure database access policies once authentication is implemented.

## Environment Variables

- Copy values from `.env.example` into Vercel, Supabase, and local `.env` as needed.
- Keep public variables limited to safe `NEXT_PUBLIC_*` values.
- Rotate secrets if they are ever exposed.
- Keep production and staging values separate.

## Database Migration Strategy

- Use Prisma migrations as the source of truth.
- Run migrations against staging before production.
- Review generated SQL before production migration.
- Back up production before applying migrations.
- Avoid destructive migrations without a rollback plan.

## Seed Strategy

- Use demo seed data locally.
- Use carefully controlled staging data for previews.
- Do not run full demo seed blindly against production.
- Production data should come from approved admin actions and reviewed imports.

## Cron Jobs

- Start with cron jobs disabled.
- Enable only dry-run jobs first.
- High-risk jobs must create review items only.
- Results, standings, records, and statistics must not auto-publish.

## Backups

- Enable Supabase automated backups.
- Test restore procedures before launch.
- Keep export procedures for critical historical data.

## Monitoring

- Use Vercel deployment status and function logs.
- Use Supabase database metrics.
- Add application monitoring in a later approved step.
- Track failed imports and review queue volume in admin.

## Logs

- Never log secrets.
- Keep connector errors actionable.
- Preserve import run errors and audit entries.
- Add structured logging later for production jobs.

## Domain and SSL

- Add the production domain in Vercel.
- Confirm SSL is active.
- Update `NEXT_PUBLIC_SITE_URL`.
- Verify canonical URLs, sitemap, and robots output.

## Security

- Protect admin routes before production launch.
- Keep Supabase service role keys server-only.
- Restrict cron endpoints with `CRON_SECRET`.
- Validate all connector payloads before review.
- Apply least privilege to future admin roles.

## Admin Protection

- Do not launch admin publicly without authentication.
- Future roles: owner, admin, editor, reviewer.
- Review actions should require privileged roles.
- Audit all manual and automation-driven changes.

## API Limits

- Respect YouTube, weather, map, and future official-source rate limits.
- Cache repeated reads.
- Back off failed connector runs.
- Store source snapshots so parsing can be retried without refetching.
