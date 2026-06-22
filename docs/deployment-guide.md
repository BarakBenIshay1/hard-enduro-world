# Deployment Guide

This guide explains how Hard Enduro World can be deployed later to Vercel + Supabase. Do not deploy until the project is approved for a production step.

## 1. Connect GitHub to Vercel

1. Open Vercel.
2. Import the GitHub repository.
3. Select the Hard Enduro World project.
4. Confirm pnpm is detected.
5. Set the build command to `pnpm run build`.
6. Keep production deployments tied to the reviewed production branch.

## 2. Create Supabase Project

1. Create a Supabase project for staging.
2. Create a separate Supabase project for production.
3. Copy the PostgreSQL connection string for each environment.
4. Store the connection strings only in environment variable managers.

## 3. Add Environment Variables

Use `.env.example` as the template.

Required deployment variables:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_ENV`
- `DATABASE_URL`
- `DIRECT_DATABASE_URL` if needed for direct migration access

Future service variables:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `YOUTUBE_API_KEY`
- `YOUTUBE_CHANNEL_ID`

Never commit real secrets.

## 4. Run Prisma Migrations

1. Run migrations locally against local Docker PostgreSQL during development.
2. Run migrations against staging first.
3. Verify staging pages and admin previews.
4. Back up production before production migration.
5. Run production migrations only after review.

## 5. Configure Production Database URL

- Set `DATABASE_URL` in Vercel to the Supabase production connection string.
- Use the pooled connection string for runtime if Supabase recommends it.
- Use a direct connection string for migrations if needed.

## 6. Configure Redis / Upstash Later

- Create an Upstash Redis database for staging.
- Create a separate Upstash Redis database for production.
- Add REST URL and token to the correct Vercel environment.
- Keep Redis optional until caching and job state are fully wired.

## 7. Verify Public Pages

After a deployment preview:

- Visit `/`
- Visit `/events`
- Visit `/riders`
- Visit `/teams`
- Visit `/manufacturers`
- Visit `/motorcycles`
- Visit `/standings`
- Visit `/results`
- Visit `/statistics`
- Visit `/records`
- Visit `/history`
- Visit `/videos`

Confirm pages load, metadata is correct, and no secret values render.

## 8. Verify Admin Pages

Before production launch, admin must be protected by authentication.

Preview-only checks:

- `/admin`
- `/admin/sources`
- `/admin/audit`
- `/admin/review`
- `/admin/jobs`
- `/admin/imports`
- `/admin/automation`
- `/admin/calculations`
- `/admin/recalculation`
- `/admin/system`

Confirm admin pages are no-index and do not expose secrets.

## 9. Verify No Secrets Are Committed

Before any deployment:

- Inspect `.env.example` for placeholders only.
- Confirm `.env` is ignored.
- Review Vercel environment variables.
- Rotate any key that was pasted into source code or logs.

## 10. Production Launch Gate

Do not launch until:

- Admin auth is implemented.
- Production database backups are enabled.
- Migration process is tested.
- Cron jobs are dry-run only or explicitly approved.
- High-risk imports require review.
- Monitoring and rollback plans are documented.
