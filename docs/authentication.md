# Authentication and Roles Foundation

Step 23 prepared the admin authentication and authorization architecture. Step 29
adds the Supabase Auth integration foundation while keeping the role and permission
model stable.

## Current Flow

User
-> Authentication
-> Session
-> Role
-> Permission
-> Protected Route
-> Admin Action

Current behavior uses Supabase Auth when the Supabase environment variables are
configured. When they are not configured, the app uses a clearly labelled local
development fallback so the admin foundation remains reviewable without secrets.

## Current Modules

- `lib/auth/roles.ts`
  - Defines `owner`, `admin`, `editor`, `reviewer`, and `viewer`.
- `lib/auth/permissions.ts`
  - Defines typed permissions for sources, review queue, imports, automation, calculations, settings, and users.
- `lib/auth/session.ts`
  - Resolves Supabase sessions, maps users to platform roles, and provides a local
    development fallback when Supabase is not configured.
- `lib/auth/role-mapping.ts`
  - Maps `UserProfile.role` values to platform roles.
- `lib/auth/guards.ts`
  - Provides route/action guard helpers and protected-area definitions.
- `lib/auth/mock-users.ts`
  - Provides demo admin users for preview pages.
- `lib/admin/access.ts`
  - Compatibility bridge used by the existing admin layout.

## Roles

- Owner
  - Full access to all permissions and future platform ownership controls.
- Admin
  - Broad operational access without full owner-only controls.
- Editor
  - Content/data editing preparation without high-risk approval authority.
- Reviewer
  - Import review and calculation review preparation.
- Viewer
  - Read-only admin visibility.

## Protected Areas

Prepared guards cover:

- `/admin/*`
- Review actions
- Import actions
- Automation actions
- Calculation review
- Settings and future user management

## Supabase Auth Plan

The current foundation supports:

1. Supabase Auth client setup.
2. Google OAuth and email login preparation.
3. Supabase user mapping to internal `UserProfile` records.
4. Platform role assignment through PostgreSQL profile data.
5. Server-side session resolution.
6. Admin route protection when Supabase is configured.
7. Future server-action permission checks.
8. Future audit attribution through `DataVersion` or a dedicated audit table.

## Future Audit Integration

High-risk admin actions should record:

- User id
- Role at time of action
- Permission used
- Entity type
- Entity id
- Previous value
- New value
- Source URL or snapshot id
- Timestamp

Authentication should protect the action. Audit history should explain the action later.
