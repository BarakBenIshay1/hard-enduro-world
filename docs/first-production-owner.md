# First Production Owner

The first production owner is configured through Supabase Auth and the
`ADMIN_OWNER_EMAIL` environment variable.

```text
ADMIN_OWNER_EMAIL=barakbenishay1@gmail.com
```

This value does not authenticate the user by itself. The owner account receives
OWNER access only after Supabase successfully authenticates the same email
address and the server resolves that Supabase user.

## Required Configuration

Configure the same value in every environment that should recognize the first
owner:

| Environment       | Where to configure                                    |
| ----------------- | ----------------------------------------------------- |
| Vercel Production | Project Settings → Environment Variables → Production |
| Vercel Preview    | Project Settings → Environment Variables → Preview    |
| Local development | `.env.local`                                          |

Required auth and database variables:

```text
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ADMIN_OWNER_EMAIL=barakbenishay1@gmail.com
```

`SUPABASE_SERVICE_ROLE_KEY` is reserved for trusted server-side operations and
must stay server-only. It is not required for the current request-session lookup.

## Bootstrap Behavior

After a successful Supabase login:

1. The server reads the Supabase auth cookie.
2. Supabase verifies the authenticated user.
3. The app searches for an existing `UserProfile` by Supabase user ID or email.
4. If a matching profile exists, that profile remains authoritative.
5. If no profile exists and the authenticated email matches `ADMIN_OWNER_EMAIL`,
   the app creates one `UserProfile` with role `OWNER`.
6. Future requests reuse that `UserProfile`.

The app does not create duplicate owner profiles. Existing profile records are
not overwritten by the environment variable.

## Safe First Owner Steps

1. Configure Supabase Auth for the production domain and preview domains.
2. Add the required variables in Vercel Production and Preview.
3. Add the same variables to local `.env.local` when testing locally.
4. Create or invite the Supabase Auth user for `barakbenishay1@gmail.com`.
5. Sign in through the configured Supabase Auth provider.
6. Visit `/admin/review`.
7. Confirm the `UserProfile` row exists with role `OWNER`.

No admin password should be stored, generated, committed, logged, or documented
in source code, README files, fixtures, migrations, tests, or environment
examples. The owner must authenticate through Supabase Auth.
