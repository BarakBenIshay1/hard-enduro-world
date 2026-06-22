# Automation Foundation

Step 16 adds the internal structure for future automatic data collection without
fetching external websites or mutating production data.

## Future Flow

Scheduled job
-> fetch source
-> save snapshot
-> parse
-> validate
-> diff
-> review queue
-> approve
-> update data
-> audit log

## Current Scope

- The job registry is typed in `jobs/automation/registry.ts`.
- The runner, snapshot, validation, and diff modules are placeholders only.
- Admin pages show job health, registry definitions, and existing import-run history.
- Import approval and rejection buttons are disabled placeholders.
- No real scraper, cron job, external API call, or mutation flow is implemented yet.

## Future Integration Points

- GitHub Actions or Vercel Cron can trigger registered jobs.
- Source snapshots should be saved before parsing.
- Parsed rows should be validated before creating diffs.
- High-risk jobs should enter `/admin/review`.
- Approved changes should write domain records and create `DataVersion` audit rows.
