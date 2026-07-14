# Admin Events CMS

The Admin Events CMS is the production editor for Event records. Public Event pages remain public, while all CMS actions require the existing Supabase-authenticated admin authorization layer.

## Lifecycle

Archive is the standard removal method:

Active -> Draft -> Archived

Archived Events are not physically deleted. Archiving records `archivedAt`, `archivedBy`, changes visibility to `PRIVATE`, and creates an immutable `DataVersion` audit entry.

OWNER and ADMIN users may create, edit, archive, and restore Events. REVIEWER users have read-only access.

## Permanent Delete

Permanent deletion is exceptional maintenance for eligible manual/test records only. It is OWNER-only and lives in the Event detail Danger Zone.

Permanent deletion is blocked unless every condition is true:

- The Event is archived first.
- The Event has a user-created manual `DataVersion` CREATE audit.
- No connector review/application history references the Event.
- No source tracking links reference the Event.
- No Results exist.
- No Stages exist.
- No timeline items exist.
- No weather snapshots exist.
- No media dependencies exist.

The delete form requires:

- The exact Event slug or exact Event name.
- A deletion reason.
- An explicit irreversible-delete checkbox.

The server re-runs dependency checks inside the delete transaction. Browser eligibility is informational only.

## Tombstone Audit

When an eligible Event is permanently deleted, the CMS writes an immutable `DataVersion` record with:

- `entityType: EventDeletionTombstone`
- Deleted Event ID, name, slug, season, championship, and country
- Acting user ID and email
- Deletion timestamp
- Deletion reason
- Final Event snapshot
- Dependency-check result

`DataVersion` does not have a foreign key to Event, so tombstone history remains after the Event row is removed.

## Connector Safety

Connector snapshots and review items are never deleted by the Events CMS. Connector-managed or connector-applied Events fail the permanent-delete eligibility check.

If an official source later proposes an Event similar to a deleted manual/test Event, it must return through the normal Import -> Review -> Approve -> Apply flow.

## Audit Display

Event audit history displays user display name and email when a matching `UserProfile` exists. The internal user ID remains stored in `DataVersion.createdBy`.

Timestamps are displayed using the admin timezone policy:

Asia/Jerusalem, rendered as `UTC+3` for the current production operating timezone.

Field diffs normalize empty strings versus nulls, whitespace, date serialization, JSON key order, and image URL array order before marking a field as changed.

## Production QA

Use a manually created QA Event only:

1. Create a draft QA Event.
2. Confirm the Event has a CREATE audit with an admin actor.
3. Archive the Event.
4. Confirm it disappears from the default Active list.
5. Filter Archived and open it.
6. Confirm the Danger Zone dependency check is eligible.
7. Enter the exact slug or exact name.
8. Enter a deletion reason.
9. Permanently delete it.
10. Confirm the Event no longer appears in Admin Events.
11. Confirm the public Event page is not available.
12. Confirm the `EventDeletionTombstone` audit exists.
13. Confirm Review -> Approve -> Apply still works.

When uncertain, archive and preserve the record.
