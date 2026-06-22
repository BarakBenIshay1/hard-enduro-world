# Authentication and Roles Foundation

Step 23 prepares the admin authentication and authorization architecture without connecting real login providers yet.

## Current Flow

User
-> Authentication
-> Session
-> Role
-> Permission
-> Protected Route
-> Admin Action

Current behavior uses a mock owner session only. No real Supabase Auth, Google OAuth, or email login is active yet.

## Current Modules

- `lib/auth/roles.ts`
  - Defines `owner`, `admin`, `editor`, `reviewer`, and `viewer`.
- `lib/auth/permissions.ts`
  - Defines typed permissions for sources, review queue, imports, automation, calculations, settings, and users.
- `lib/auth/session.ts`
  - Provides a mock session provider that can later be replaced by Supabase Auth.
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

## Future Supabase Auth Plan

Future implementation should:

1. Enable Supabase Auth.
2. Add Google OAuth and email login providers.
3. Map Supabase users to internal `UserProfile` records.
4. Store platform role assignments in PostgreSQL.
5. Resolve the session server-side.
6. Enforce route and server-action permissions.
7. Audit privileged actions through `DataVersion` or a dedicated audit table.

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
