# Admin Authentication

Hard Enduro World is public by default. Visitors can browse public pages without
an account. Only `/admin` and routes below `/admin/*` require authentication and
authorization.

## Public And Admin Boundaries

Public routes remain anonymous:

- `/`
- `/events` and `/events/[slug]`
- `/future-events`
- `/riders` and `/riders/[slug]`
- `/teams` and `/teams/[slug]`
- `/manufacturers` and `/manufacturers/[slug]`
- `/motorcycles` and `/motorcycles/[slug]`
- `/results`
- `/standings`
- `/statistics`
- `/records`
- `/videos`
- `/history` and `/history/[year]`
- `/championship`
- `/robots.txt`
- `/sitemap.xml`

Admin routes are protected:

- `/admin`
- `/admin/review`
- `/admin/review/[id]`
- `/admin/jobs`
- `/admin/imports`
- `/admin/audit`
- `/admin/users`
- `/admin/system`
- `/admin/deployment`
- `/admin/security`
- `/admin/sources`
- `/admin/preflight`
- `/admin/recalculation`
- `/admin/automation`

The middleware matcher is limited to `/admin/:path*`, so future public routes do
not inherit admin authentication by accident.

## Authentication Flow

```text
Visitor requests /admin/review/123
        |
        v
Middleware checks for a Supabase auth cookie
        |
        v
No cookie -> /login?next=/admin/review/123
        |
        v
Admin signs in with Google through Supabase Auth
        |
        v
/auth/callback exchanges the OAuth code for a Supabase session
        |
        v
Server resolves UserProfile and permissions
        |
        v
Authorized -> requested admin URL
Unauthorized -> /access-denied
```

`/login` accepts only same-app admin destinations. External URLs and public page
destinations are rejected and replaced with `/admin`.

## Authorization Flow

Authorization continues to use the existing project model:

- `getAdminAccessContext()`
- `UserProfile`
- roles
- permissions
- review approval/rejection/application guards
- audit logging

Supabase provides identity. Hard Enduro World provides roles and permissions.
Server Actions still re-check authorization server-side before mutating review
or application state.

## First Owner Bootstrap

Set:

```text
ADMIN_OWNER_EMAIL=barakbenishay1@gmail.com
```

The email alone does not grant access. The owner must authenticate through
Supabase Auth first.

Bootstrap rules:

- Existing `UserProfile` records are authoritative.
- `ADMIN_OWNER_EMAIL` may create the first OWNER profile only when no matching
  profile exists and no OWNER profile exists.
- Matching is exact after email normalization.
- No arbitrary authenticated user receives an admin profile.
- The bootstrap profile creation is audited.
- Passwords are never stored in source code, documentation, fixtures, tests, or
  environment examples.

Future admins should be managed through `UserProfile`.

## Required Environment Variables

Production and Preview:

```text
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ADMIN_OWNER_EMAIL=barakbenishay1@gmail.com
```

Local development uses the same variables in `.env.local` when testing the real
auth flow.

`SUPABASE_SERVICE_ROLE_KEY` is optional for this authentication flow. If it is
configured for future trusted server operations, keep it server-only and never
expose it as a `NEXT_PUBLIC_` variable.

Environment variable changes require a new Vercel deployment.

## Supabase Dashboard Setup

Configure a Supabase Auth provider.

Google OAuth:

- Enable Google as an Auth provider in Supabase.
- Configure the Google OAuth client in Supabase.
- Add the production site URL:
  `https://hard-enduro-world.vercel.app`
- Add the production redirect URL:
  `https://hard-enduro-world.vercel.app/auth/callback`
- Add local development redirect:
  `http://localhost:3000/auth/callback`

For Vercel Preview deployments, add each trusted preview callback URL explicitly.
Avoid broad wildcard redirects unless the Supabase project security policy
explicitly approves the pattern.

## Login, Callback, Logout

- `/login` starts the Supabase Google OAuth flow.
- `/auth/callback` exchanges the OAuth code, establishes the session, validates
  authorization, and redirects to the requested admin URL.
- Logout is a server action from the admin header. It signs out through Supabase,
  clears the session cookies, audits the logout, and redirects to `/`.

## Access Denied

Authenticated but unauthorized users go to `/access-denied`.

The page shows:

- 403-style access denied message
- authenticated email
- current role
- homepage link
- logout action

It does not expose permission internals, database IDs, tokens, cookies, OAuth
codes, or stack traces.

## Troubleshooting

Redirects to `/login`:

- The request has no valid Supabase session cookie.
- The session expired.
- Supabase URL or anon key is missing in production.

Redirects to `/access-denied`:

- The user authenticated successfully but lacks admin permissions.
- The user has no `UserProfile` and does not match `ADMIN_OWNER_EMAIL`.
- An existing `UserProfile` assigns a non-admin role.

Callback failure:

- The OAuth code expired.
- Supabase redirect URL does not match the deployed domain.
- Supabase provider configuration is incomplete.

Public pages redirecting to login would be a regression. The middleware matcher
must remain scoped to `/admin/:path*`.
