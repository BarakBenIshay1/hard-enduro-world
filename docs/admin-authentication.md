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

The OAuth flow uses Supabase PKCE with server-side cookie storage. The login
action stores Supabase's one-time PKCE verifier in an HTTP-only cookie, and
`/auth/callback` reads that verifier before exchanging the OAuth code for a
session. Cookies use `SameSite=Lax` so the top-level Google redirect can return
to the app, and `Secure` is enabled in production.

## Public Header Fast Path

The public header includes a discreet admin shortcut for authorized admins, but
anonymous public traffic must stay cheap:

```text
Public request
        |
        v
No validated Supabase user
        |
        v
No UserProfile lookup
        |
        v
No admin shortcut
        |
        v
Public page renders normally
```

Only a real validated Supabase user may trigger the `UserProfile` lookup needed
to build the admin shortcut. Temporary OAuth and PKCE cookies are not treated as
authenticated sessions.

Admin access context is request-scoped and reused within the same server render
so multiple components do not repeat Supabase auth checks or `UserProfile`
queries. This cache is not global and must never be used across users.

If optional public-header admin context cannot be resolved because of a temporary
database or profile lookup problem, the public page should continue rendering and
the admin shortcut stays hidden. Admin routes still fail closed because they use
the strict admin layout guard.

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

## Prisma And Vercel Connection Safety

The app uses the shared Prisma singleton in `lib/prisma.ts`. Do not create
additional `PrismaClient` instances inside components, route handlers, or Server
Actions. Do not disconnect Prisma after each request.

In Vercel production, `DATABASE_URL` should use the Supabase Transaction Pooler
runtime connection string. Anonymous public traffic should not consume database
connections solely to decide whether to show the admin shortcut. If connection
pressure appears in logs, first verify that anonymous requests are not performing
admin `UserProfile` lookups before increasing pool sizes.

Optional diagnostics can be enabled with:

```text
AUTH_DIAGNOSTICS=true
```

Diagnostics are sanitized and never log cookies, tokens, OAuth codes, database
URLs, or secrets. Keep this disabled unless actively investigating auth behavior.

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
