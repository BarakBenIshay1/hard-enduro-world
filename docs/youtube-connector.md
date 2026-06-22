# YouTube Connector

Step 26 upgrades the YouTube connector foundation to support the real YouTube Data API v3 while preserving review-first publishing.

The connector can fetch:

- Channel metadata
- Latest videos
- Playlists
- Thumbnails
- Publish dates
- Video URLs
- Video IDs

No real secrets are committed. No video is auto-published.

## Environment Variables

Use placeholders in `.env.example`:

- `YOUTUBE_API_KEY=`
- `YOUTUBE_CHANNEL_ID=`

Local `.env` may contain real values, but real values must never be committed.

If either value is missing, the connector uses safe demo fallback data and marks the API status as `demo-fallback` / `missing-config`.

## Setup Later

1. Create or select a Google Cloud project.
2. Enable YouTube Data API v3.
3. Create an API key with suitable restrictions.
4. Find the official channel id.
5. Set `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID` in the target environment.
6. Test in staging before production.

## API Endpoints

The connector is prepared to call:

- `channels`
  - Used for channel lookup and uploads playlist metadata.
- `search`
  - Used for latest videos by channel.
- `playlists`
  - Used for playlist metadata.

## Quotas

YouTube Data API uses quota units. Production jobs should:

- Limit `maxResults`.
- Avoid unnecessary repeated fetches.
- Cache or snapshot fetched payloads.
- Prefer scheduled runs over frequent polling.
- Track failures and quota-related errors in `ImportRun`.

## Source Tracking

Every fetch must prepare source tracking:

- `DataSource`
- `SourceSnapshot`
- `ImportRun`
- `SourceLink`
- `DataVersion` preview

Current Step 26 behavior builds source-tracking preview objects for review. Future approval actions can persist these records through the admin review flow.

## Review Workflow

YouTube API
-> fetch channel/videos/playlists
-> create source snapshot preview
-> normalize video metadata
-> create pending review items
-> admin review
-> approval later
-> publish to `/videos`

## Safety Rule

YouTube metadata can create pending media review items only. It must not update championship results, standings, points, records, riders, teams, manufacturers, or motorcycles.

The public `/videos` page only reads approved/import-ready media records. Fresh fetched API results stay inside `/admin/jobs/youtube-videos` until the future approval system publishes them.
