# Supabase Authentication Foundation

Step 29 replaces the mock-first admin access concept with a Supabase Auth-ready
architecture while keeping the existing role and permission model intact.

## Goal

Supabase is responsible for identity. Hard Enduro World is responsible for platform
roles, permissions, admin route protection, and audit-ready authorization decisions.

```text
Google OAuth / Email Login
        |
        v
Supabase Session
        |
        v
Supabase User ID / Email
        |
        v
UserProfile Mapping
        |
        v
Platform Role
        |
        v
Permission Check
        |
        v
Protected Admin Access
```

## Environment Variables

The integration uses placeholders only. Real values must be configured locally,
in staging, and in production through environment variables.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_OWNER_EMAIL=barakbenishay1@gmail.com
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` enable browser and
server auth clients. `SUPABASE_SERVICE_ROLE_KEY` is reserved for future trusted
server-side admin operations and must never be exposed to the browser.

## Auth Clients

The Supabase client foundation lives in:

```text
lib/supabase/browser.ts
lib/supabase/server.ts
lib/supabase/auth.ts
lib/supabase/config.ts
```

The browser client is prepared for interactive login flows. The server client is
prepared for session lookup and protected admin rendering.

## Login Methods

Google OAuth and email login are prepared as supported flows, but real provider
configuration is not required in this step.

Future login flow:

```text
User clicks login
        |
        v
Supabase Google OAuth or Email Login
        |
        v
Supabase redirects back with a session
        |
        v
Server resolves session from auth cookies
        |
        v
Admin shell checks platform permissions
```

## Role Mapping

Supabase users map into the existing `UserProfile` model. The current Prisma role
enum is mapped into the platform authorization roles:

| UserProfile.role | Platform role |
| ---------------- | ------------- |
| OWNER            | owner         |
| ADMIN            | admin         |
| EDITOR           | editor        |
| ANALYST          | reviewer      |
| USER             | viewer        |

`ADMIN_OWNER_EMAIL` can bootstrap one verified Supabase user as `owner` until
full profile management is implemented. The email does not grant access by
itself; the user must first authenticate through Supabase Auth. If a matching
`UserProfile` already exists, that profile remains authoritative and is not
overwritten by the environment variable.

## Permissions

The existing permission model remains centralized in `lib/auth/permissions.ts`.

Protected areas include:

- `/admin/*`
- review actions
- import actions
- automation actions
- calculation actions
- settings and user management

Future server actions should call the same permission helpers before mutating data.

## Route Protection

When Supabase is configured, unauthenticated admin requests redirect away from the
admin shell. When Supabase is not configured, the app uses a clearly labelled local
development fallback so the admin foundation remains reviewable without real secrets.

This fallback is not a production auth provider.

## Audit Integration

Future admin mutations should attach the resolved user identity to:

- `DataVersion.createdBy`
- import review approvals
- audit log entries
- source and automation actions

This keeps every sensitive data change attributable to a real authenticated user.

## Production Notes

Before production launch:

- Configure Supabase project URL and anon key.
- Configure Google OAuth in Supabase.
- Enable email login or magic links if desired.
- Add production redirect URLs.
- Set `ADMIN_OWNER_EMAIL=barakbenishay1@gmail.com` for the initial owner account
  in Vercel Production, Vercel Preview, and local `.env.local` where needed.
- Let the first successful Supabase login create the matching OWNER
  `UserProfile`, or create `UserProfile` records manually for additional admin
  users.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Verify `/admin/*` redirects unauthenticated users.

See `docs/first-production-owner.md` for the production owner bootstrap steps.
