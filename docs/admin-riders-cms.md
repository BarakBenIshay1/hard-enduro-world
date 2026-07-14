# Admin Riders CMS

The Riders CMS manages rider profile metadata only.

It must never modify:

- Results
- Points
- Standings
- Championship classifications
- Historical team assignments
- Historical motorcycle assignments

## Supported Fields

- First name
- Last name
- Slug
- Country
- Current motorcycle
- Birth date
- Official URL
- Profile image upload with preview
- Advanced profile image URL
- Visibility
- Archive metadata

## Profile Image Upload

Rider profile images use the shared Admin media upload workflow.

- OWNER and ADMIN users can upload images.
- REVIEWER users can view image metadata but cannot upload or replace images.
- Supported types: JPG, PNG, WebP, AVIF.
- Maximum size: 5 MB.
- Uploads are stored in Supabase Storage through the protected admin upload route.
- Uploads use the dedicated `POST /admin/riders/media` Route Handler, not a
  Server Action.
- Unauthenticated upload requests return a JSON `401` response instead of
  redirecting the image POST body to `/login`.
- The generated public URL is saved into the rider profile when the editor form is saved.
- Removing an image clears the rider profile URL on save; it does not delete historical storage objects.

Required storage configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=hard-enduro-media
```

The storage service role key is server-only. It must never be exposed to the
browser. The bucket should be configured so approved public profile images are
readable by the website.

The upload policy is intentionally bounded:

- File size limit: 5 MB.
- Request envelope limit: 6 MB, allowing multipart overhead while still
  preventing oversized media requests.
- Allowed MIME types are validated in the browser and again on the server.

## Lifecycle

OWNER and ADMIN users can create, edit, archive, and restore rider profiles. REVIEWER users have read-only access.

Archived riders remain preserved for historical data and audit history.

## Permanent Delete

Permanent deletion is OWNER-only and fail-closed. A rider must:

- Be archived
- Have a manual CREATE audit
- Have no Results
- Have no Stage Results
- Have no Standings
- Have no Rider Career Seasons
- Have no Team Memberships
- Have no Source Links

When any dependency exists, archive is the only safe removal path.

## Future Rollout

Teams, Manufacturers, and Motorcycles should reuse the same Admin Platform patterns while defining their own protected dependencies and domain rules.
