# Admin Teams CMS

The Teams CMS manages team profile metadata only.

It must never modify:

- Rider memberships
- Results
- Points
- Standings
- Championship classifications
- Historical team assignments
- Connector review/apply records

## Supported Fields

- Team name
- Slug
- Country
- Current manufacturer partner
- Official website
- Team manager
- Description
- Status
- Visibility
- Logo upload
- Gallery image URL list
- Archive metadata

## Logo Upload

Team logos use the shared Admin media upload workflow.

- OWNER and ADMIN users can upload logos.
- REVIEWER users can view metadata but cannot upload or replace logos.
- Supported types: JPG, PNG, WebP, AVIF.
- Maximum size: 5 MB.
- Uploads use the dedicated `POST /admin/teams/media` Route Handler.
- Unauthenticated upload requests return JSON `401` responses instead of redirecting image bodies to `/login`.
- Team logos are stored in the shared bucket at `teams/<team-id>/logo/<sanitized-generated-filename>`.
- The generated public URL is saved into the team profile when the editor form is saved.
- Removing a logo clears the team logo URL on save; it does not delete historical storage objects.

Required storage configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=hard-enduro-media
```

The service role key is server-only and must never be exposed to the browser.

## Lifecycle

OWNER and ADMIN users can create, edit, archive, and restore team profiles.
REVIEWER users have read-only access.

Archived teams remain preserved for historical data and audit history.

## Permanent Delete

Permanent deletion is OWNER-only and fail-closed. A team must:

- Be archived
- Have a manual CREATE audit
- Have no Team Memberships
- Have no Rider Career Seasons
- Have no Source Links

When any dependency exists, archive is the only safe removal path.

## Audit

Every Team CMS mutation writes an immutable `DataVersion` entry:

- CREATE
- UPDATE
- MANUAL_EDIT for archive/restore
- DELETE tombstone for eligible permanent deletes

The audit table renders actor, email, timestamp, and changed fields.

## Future Rollout

Manufacturers and Motorcycles should reuse the same Admin Platform patterns while
defining their own protected dependencies and domain rules.
