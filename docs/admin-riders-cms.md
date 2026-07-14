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
- Profile image URL
- Visibility
- Archive metadata

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
