# YouTube Connector

Step 17 adds a safe foundation for importing video metadata. It does not call the
real YouTube API, does not require a real API key, and does not publish media
without review.

## Future Flow

YouTube API
-> fetch videos
-> save snapshot
-> normalize video metadata
-> create pending review
-> admin approval
-> publish to `/videos`

## Source Tracking

No external data should bypass source tracking. A real connector run should create
or reuse:

- `DataSource`
- `SourceSnapshot`
- `ImportRun`
- `SourceLink`
- `DataVersion`

## Current Scope

- `jobs/connectors/youtube/` contains typed connector placeholders.
- The demo fetcher returns mock video metadata.
- The normalizer prepares MediaItem-shaped payloads.
- The automation registry links the `youtube-videos` job to the connector path.
- `/admin/jobs/youtube-videos` shows configuration, source tracking, sample videos,
  and a diff preview.
- `/videos` displays demo/import-ready videos.

## Safety Rule

YouTube metadata can create pending media review items only. It must not update
championship results, standings, points, records, riders, teams, manufacturers,
or motorcycles.
