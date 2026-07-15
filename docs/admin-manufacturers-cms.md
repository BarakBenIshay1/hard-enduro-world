# Admin Manufacturers CMS

The Manufacturers CMS manages motorcycle brand profile metadata only.

It must never modify:

- Motorcycles
- Teams
- Riders
- Results
- Stage results
- Standings
- Manufacturer season statistics
- Historical classifications
- Connector review/apply records

## Supported Fields

- Name
- Slug
- Country
- Founded year
- Website
- Description
- Status
- Visibility
- Logo upload
- Archive metadata

## Logo Upload

Manufacturer logos use the shared Admin media upload workflow.

- OWNER and ADMIN users can upload logos.
- REVIEWER users can view metadata but cannot upload or replace logos.
- Supported types: JPG, PNG, WebP, AVIF.
- Maximum size: 5 MB.
- Uploads use the dedicated `POST /admin/manufacturers/media` Route Handler.
- Unauthenticated upload requests return JSON `401` responses instead of redirecting image bodies to `/login`.
- Manufacturer logos are stored in the shared bucket at `manufacturers/<manufacturer-id>/logo/<sanitized-generated-filename>`.
- The generated public URL is saved into the manufacturer profile when the editor form is saved.
- Removing a logo clears the manufacturer logo URL on save; it does not delete historical storage objects.

Required storage configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=hard-enduro-media
```

The service role key is server-only and must never be exposed to the browser.

## Public Visibility

Public manufacturer pages show only records where:

- `visibility = PUBLIC`
- `archivedAt` is empty

Draft, private, and archived manufacturers are available in Admin but hidden from
the public website.

## Lifecycle

OWNER and ADMIN users can create, edit, archive, and restore manufacturer
profiles. REVIEWER users have read-only access.

Archived manufacturers remain preserved for historical data and audit history.

## Permanent Delete

Permanent deletion is OWNER-only and fail-closed. A manufacturer must:

- Be archived
- Have a manual CREATE audit
- Have no Motorcycles
- Have no Results
- Have no Stage Results
- Have no Rider Career Seasons
- Have no Manufacturer Season Stats
- Have no Teams
- Have no Source Links

When any dependency exists, archive is the only safe removal path.

## Audit

Every Manufacturer CMS mutation writes an immutable `DataVersion` entry:

- CREATE
- UPDATE
- MANUAL_EDIT for archive/restore
- DELETE tombstone for eligible permanent deletes

The audit table renders actor, email, timestamp, and changed fields.
