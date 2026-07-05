# Rider Pilot: Manuel Lettenbichler

Goal: prepare the first production-quality verified rider profile without adding
unverified biography, team, bike, or result claims.

## Current Internal State

Seed/profile data currently contains:

- Rider: Manuel Lettenbichler
- Slug: `manuel-lettenbichler`
- Country in seed: Germany
- Birth date in seed: 1998-03-10
- Team in seed: Red Bull KTM Factory Racing
- Manufacturer in seed: KTM
- Motorcycle in seed: KTM 300 EXC 2026

Verified-data layer currently contains:

- Red Bull Erzbergrodeo 2026 overall P1: Manuel Lettenbichler
- Status: Finished
- Verified winner: Manuel Lettenbichler
- Exact time: unknown/null
- Gap: unknown/null
- Points: unknown/null
- Source id: `red-bull-erzbergrodeo-official`

Important: the seed/profile fields above should be treated as profile scaffolding until
official sources confirm each field.

## Target Fields For The Manuel Pilot

### Identity

- Full name
- Slug
- Nationality/country
- Date of birth
- Birthplace, if official source provides it
- Official website/social links, if available from official profile sources
- Rider status for 2026

### Profile Media

- Approved portrait/profile image
- Image source URL
- Photographer/owner
- License/usage permission
- Date taken, if available
- Attribution text

### Biography

- Short verified bio
- Career summary
- Current championship context
- Major achievements, only when source-backed

### Current Setup

- Current team
- Manufacturer
- Motorcycle model
- Model year, if official source confirms it
- Rider number, if official source confirms it
- Class/category, if applicable

### Results

- Red Bull Erzbergrodeo 2026 verified result
- Other 2026 completed event results, only after official result sources are reviewed
- Stage results, only after official stage timing/classification is reviewed
- Points, only from official event result or approved standings calculation

### Related Links

- Team page
- Manufacturer page
- Motorcycle page
- Events where Manuel has verified participation/result rows

## Official Sources Needed

Primary source candidates:

- FIM official Hard Enduro World Championship rider/profile pages.
- Official Hard Enduro World Championship rider profile.
- KTM official rider page.
- Red Bull KTM Factory Racing official rider page.
- Red Bull Erzbergrodeo official 2026 classification.
- Official timing exports or final classification PDFs.

Allowed media/video support:

- Red Bull Motorsports official YouTube channel for media references.
- KTM / Red Bull KTM official media, only if usage rights and attribution are clear.

Do not use:

- Fan pages.
- Random blogs.
- Unsourced social posts.
- Third-party photos without explicit usage rights.
- Video channels as official result sources.

## Profile Image Source Requirements

Before adding a profile image, collect:

- Official image URL or approved local asset source.
- Source owner/copyright holder.
- License or permission notes.
- Attribution requirement.
- Related rider/entity link.
- Date retrieved/reviewed.

If any of this is missing, keep the current initials portrait placeholder.

## Biography Source Requirements

Biography text must be based on official or trusted primary sources and should cite:

- Source name
- Source URL
- Date reviewed
- Confidence level
- Notes about what the source confirms

Unverified biography text should not be added. If official sources only confirm limited
facts, keep the bio short.

## Team / Manufacturer / Motorcycle Source Requirements

Before treating the setup as verified, confirm:

- Manuel's 2026 team from official team/manufacturer/rider source.
- KTM manufacturer relationship from official source.
- Motorcycle model from official KTM/team/rider source.
- Whether `KTM 300 EXC 2026` is the correct race model label for the championship context.
- Rider number, if available.

If the official source only confirms KTM or Red Bull KTM without the exact motorcycle
model, store only the verified level of detail.

## Race Result Source Requirements

For Red Bull Erzbergrodeo 2026:

- Official final classification source.
- Confirmation of Manuel Lettenbichler P1.
- Exact time, if available.
- Gap to P2, if available.
- Penalties, if any.
- Points, if the event awarded points and the official source confirms them.
- Finisher count and starter count, if available.
- Stage/prologue/day results, if official timing tables are available.

For other 2026 events:

- Do not add rows until official result/classification sources are reviewed.
- Do not infer standings, points, wins, or podiums from media summaries.

## What Can Be Filled Now

Safe to use now:

- Name: Manuel Lettenbichler
- Slug: `manuel-lettenbichler`
- Existing internal profile entity
- Existing related links if already present in the database
- Red Bull Erzbergrodeo 2026 P1 first-pass verified result row
- Status for that result: Finished

Safe but should remain marked as profile/scaffold until verified:

- Germany as country
- Birth date
- Red Bull KTM Factory Racing
- KTM
- KTM 300 EXC 2026

## What Must Wait For Verification

- Full biography.
- Official portrait image.
- Image copyright/attribution.
- Confirmed 2026 rider number.
- Confirmed 2026 motorcycle model and technical details.
- Exact Erzbergrodeo 2026 winning time.
- Erzbergrodeo 2026 gaps, penalties, points, stage results, and complete finisher list.
- 2026 championship standings.
- Career wins, podiums, titles, starts, DNFs, and points beyond the verified first-pass result.
- Any historic achievements not sourced from official records.

## Recommended Pilot Workflow

1. Verify the official rider identity/profile source.
2. Verify current team/manufacturer/motorcycle setup.
3. Verify Red Bull Erzbergrodeo 2026 final classification.
4. Add only the confirmed fields to the verified data layer or seed.
5. Keep unknown fields null.
6. Add source notes for every fact.
7. Re-run the app and confirm the rider page displays verified data without overclaiming.

## Acceptance Criteria For The Manuel Pilot

- No unsourced biography.
- No external image without rights/attribution.
- No synthetic career totals.
- No invented race times, gaps, points, or standings.
- Every populated production fact has an official source note.
- Unknown fields remain compact on the public rider profile.
