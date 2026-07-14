# Shared Admin Platform Foundation

This foundation separates Admin modules into two groups:

- Entity Management CMS modules
- Operational and System modules

Events and Riders are entity-management CMS modules. Jobs, Imports, Sources, Review, Automation, Security, System, Deployment, Health, Calculations, and Recalculation are operational modules and must not be forced into ordinary CRUD.

## Shared Components

Reusable UI patterns now include:

- `EventAlert` for accessible success/error feedback
- `EventSubmitButton` for pending-safe submit buttons with serializable icon names
- `EventEditorForm` for unsaved-change warnings
- `ImageUploadField` for protected image uploads with preview, replace, remove,
  progress, and advanced URL fallback
- Responsive editor/sidebar layout pattern
- Audit tables backed by immutable `DataVersion`
- Archive/restore panels
- Danger Zone sections with server-side dependency checks

The names still reflect their origin in the Events CMS, but the components are safe for shared Admin entity use. They only accept serializable props across Server/Client boundaries.

## Shared Server Patterns

Shared helpers live in `lib/admin/platform.ts`:

- Pagination parsing
- Total-page calculation
- Owner/Admin manage checks
- OWNER-only permanent-delete check
- Safe URL validation
- Sanitized logging
- Next redirect detection

Domain-specific validation remains in dedicated modules such as `lib/admin/rider-cms.ts` and `lib/admin/event-cms.ts`.

Shared media upload policy lives in `lib/admin/media-upload.ts`. The upload
route remains domain-owned for now so each CMS can enforce its own permissions
and storage path rules without leaking Rider-specific behavior into future
Teams, Manufacturers, Motorcycles, Results, or Standings modules.

## Permission Model

Current implementation reuses the existing role model:

- OWNER: create, edit, archive, restore, and permanently delete eligible manual/test entity records
- ADMIN: create, edit, archive, restore
- REVIEWER and lower roles: read-only

Future domain permissions should be introduced deliberately, not blindly:

- `rider:view/create/edit/archive/restore/delete-permanently`
- `team:view/create/edit/archive/restore/delete-permanently`
- `manufacturer:view/create/edit/archive/restore`
- `motorcycle:view/create/edit/archive/restore`
- `result:view/review/correct/import`
- `standings:view/recalculate/publish`
- `source:view/edit/test`
- `job:view/run/retry`
- `user:view/manage`
- `security:view`
- `system:view`

All write permissions must continue to be enforced server-side.

## Audit Standard

Every mutation should record:

- Entity type and ID
- Action
- Actor ID
- Actor display name/email when rendering
- Full timestamp
- Changed fields
- Old and new values where safe
- Reason when required
- Related source/job/review identifier when applicable

Audit entries are immutable and must not expose secrets, tokens, credentials, or raw connector internals.

## Module Rollout Plan

### Phase 1: Riders CMS

- Prisma models: `Rider`, `Country`, `Motorcycle`, `Result`, `StageResult`, `Standing`, `RiderCareerSeason`, `TeamMembership`, `SourceLink`, `DataVersion`
- Routes: `/admin/riders`, `/admin/riders/new`, `/admin/riders/[id]`
- Permissions: owner/admin write, reviewer read-only, owner-only permanent delete
- Operations: list, search, filter, sort, paginate, create, edit, archive, restore, controlled delete
- Protected dependencies: results, stage results, standings, career seasons, team memberships, source links
- Migration: additive lifecycle fields on Rider
- Public impact: none; public rider pages remain unchanged
- Tests: `pnpm run test:admin-riders`

### Phase 2: Teams CMS

Use Team metadata only. Protected dependencies include memberships and career seasons. Migration may be required for lifecycle fields.

### Phase 3: Manufacturers CMS

Use Manufacturer metadata and motorcycle relationships. Protected dependencies include motorcycles, results, stage results, rider career seasons, and season stats.

### Phase 4: Motorcycles CMS

Use Motorcycle technical metadata. Protected dependencies include current riders, results, stage results, rider career seasons, and season stats.

### Phase 5: Results Administration

Not ordinary CRUD. Must use review/correction workflows and never directly recalculate standings without approval.

### Phase 6: Standings Administration

Preview and publish workflow only. Derived from approved results.

### Phase 7: Sources and Source Map

Operational source intelligence UI. Must preserve source hierarchy, confidence, and review-first behavior.

### Phase 8: Imports, Jobs, and Automation

Operational controls for dry runs, logs, retries, failure details, and safe manual execution.

### Phase 9: Users, Security, and Settings

Role, access, profile, and security diagnostics. No duplicate auth system.

### Phase 10: System, Deployment, Health, and Preflight

Readiness, database/Supabase/connectors/job status, environment diagnostics.

### Phase 11: Calculations and Recalculation

Preview-only calculation operations until explicit publish workflows are approved.
