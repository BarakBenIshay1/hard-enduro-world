# Erzbergrodeo 2026 Production Audit

Scope: Red Bull Erzbergrodeo 2026 only.  
Purpose: audit the current public Event Dashboard and map what is required to make this single event production-quality without inventing data.

Legend:

- ✓ Complete: production-ready for the current verified scope.
- ⚠ Partial: supported and visible, but missing official detail or only first-pass verified.
- ✗ Missing: not verified or not present enough for production quality.

## Phase 1 - Page Audit

### Hero

| Item                          | Status     | Notes                                                                                                        |
| ----------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| Event breadcrumb              | ✓ Complete | Shows Events > event name.                                                                                   |
| Race status badge             | ✓ Complete | Uses centralized race status labels and styling.                                                             |
| Season/year badge             | ✓ Complete | Shows 2026.                                                                                                  |
| Round badge                   | ⚠ Partial  | UI supports it, but round value may be TBC unless official calendar data is verified.                        |
| Event title                   | ✓ Complete | Shows Red Bull Erzbergrodeo 2026.                                                                            |
| Short event description       | ⚠ Partial  | First-pass verified description exists, but full official event description is not complete.                 |
| Country and location metadata | ✓ Complete | Eisenerz, Austria is represented through event metadata.                                                     |
| Date metadata                 | ⚠ Partial  | June 2026 is represented, but exact official date range should be source-confirmed.                          |
| Elevation metadata            | ✗ Missing  | Display supports it, verified value is currently null.                                                       |
| Hero image area               | ⚠ Partial  | Production-ready placeholder exists; approved official image is missing.                                     |
| Hero podium card              | ⚠ Partial  | Verified podium names exist; rider portraits, country flags, and manufacturer badges are not fully verified. |

### Results

| Item                            | Status     | Notes                                                                                                              |
| ------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| Podium cards                    | ⚠ Partial  | Positions 1-3 are verified: Manuel Lettenbichler, Trystan Hart, Mario Roman. Timing and full metadata are missing. |
| Overall results table           | ⚠ Partial  | First three rows are verified. Full classification and all 15 finishers are missing.                               |
| Rider links from podium/results | ✓ Complete | Existing rider profile links work for verified riders.                                                             |
| Country column                  | ⚠ Partial  | Supported, depends on existing rider country profile data.                                                         |
| Team column                     | ⚠ Partial  | Supported, but team affiliation for Erzbergrodeo 2026 needs official verification.                                 |
| Manufacturer column             | ⚠ Partial  | Supported, but full row-level manufacturer proof is missing.                                                       |
| Motorcycle column               | ⚠ Partial  | Supported, but bike model proof is missing.                                                                        |
| Total time                      | ✗ Missing  | Unknown by policy; currently null/TBC.                                                                             |
| Gap to leader                   | ✗ Missing  | Unknown by policy; currently null/TBC.                                                                             |
| Gap to previous                 | ✗ Missing  | Unknown by policy; currently null/TBC.                                                                             |
| Penalties                       | ✗ Missing  | Unknown by policy; currently null/TBC.                                                                             |
| Points                          | ✗ Missing  | Unknown by policy; currently null/TBC.                                                                             |
| Status                          | ⚠ Partial  | Verified podium rows are Finished. Full DNF/DNS/DSQ status set is missing.                                         |
| Results module link             | ✓ Complete | Links to global Results module.                                                                                    |

### Stages

| Item                 | Status    | Notes                                                                                             |
| -------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| Stage timing section | ⚠ Partial | Compact placeholder exists. No official stage rows are verified.                                  |
| Prologue table       | ✗ Missing | Supported by architecture, no verified data.                                                      |
| Day 1 table          | ✗ Missing | Supported by architecture, no verified data.                                                      |
| Day 2 table          | ✗ Missing | Supported by architecture, no verified data.                                                      |
| Day 3 table          | ✗ Missing | Supported by architecture, no verified data.                                                      |
| Stage winner         | ✗ Missing | Supported by architecture, not verified.                                                          |
| Best time            | ✗ Missing | Supported by architecture, not verified.                                                          |
| Stage distance       | ✗ Missing | Supported by architecture, not verified.                                                          |
| Stage terrain        | ✗ Missing | Supported by architecture, not verified.                                                          |
| Stage difficulty     | ✗ Missing | UI concept exists in earlier design, but current compact dashboard does not have verified values. |
| DNF count per stage  | ✗ Missing | Supported by result/status architecture, no verified source rows.                                 |

### Participants

| Item                            | Status     | Notes                                                                        |
| ------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| Registered riders count         | ✗ Missing  | Placeholder exists, no official entry-list data.                             |
| Confirmed starters count        | ✗ Missing  | Placeholder exists, no official start-list data.                             |
| Verified finisher count         | ✓ Complete | 15 finishers are verified as a first-pass fact.                              |
| Full finisher identities        | ⚠ Partial  | Podium finishers are verified; remaining 12 finishers are missing.           |
| DNF count                       | ✗ Missing  | Placeholder exists, official classification needed.                          |
| DNS count                       | ✗ Missing  | Placeholder exists, official classification needed.                          |
| DSQ count                       | ✗ Missing  | Placeholder exists, official classification needed.                          |
| Rider cards                     | ⚠ Partial  | Cards render from verified result rows only; participant list is incomplete. |
| Championship position per rider | ✗ Missing  | Not verified for this event context.                                         |

### Manufacturers

| Item                        | Status    | Notes                                                                                           |
| --------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| Manufacturer summary table  | ⚠ Partial | Table is supported, but current data only reflects verified result rows and existing relations. |
| Participating manufacturers | ✗ Missing | Official entry/classification source required.                                                  |
| Factory participation       | ✗ Missing | Official paddock/team/entry source required.                                                    |
| Factory riders              | ✗ Missing | Official team/entry source required.                                                            |
| Private riders              | ✗ Missing | Official entry/team source required.                                                            |
| Linked manufacturers        | ⚠ Partial | Cross-links work where entities exist; full source-backed participation is missing.             |

### Teams

| Item               | Status    | Notes                                                                      |
| ------------------ | --------- | -------------------------------------------------------------------------- |
| Team summary table | ⚠ Partial | Table is supported, but event-specific team verification is incomplete.    |
| Factory teams      | ✗ Missing | Official team/entry source required.                                       |
| Independent teams  | ✗ Missing | Official entry/source data required.                                       |
| Support teams      | ✗ Missing | Official paddock/source data required.                                     |
| Linked teams       | ⚠ Partial | Cross-links work where entities exist; source-backed team list is missing. |

### Motorcycles

| Item                           | Status    | Notes                                                                          |
| ------------------------------ | --------- | ------------------------------------------------------------------------------ |
| Motorcycle model cards/metrics | ⚠ Partial | UI supports models, engine size, and manufacturer, but values are unverified.  |
| Bike model per rider           | ✗ Missing | Official entry/team/manufacturer source required.                              |
| Engine size                    | ✗ Missing | Official motorcycle/team source required.                                      |
| Manufacturer per bike          | ⚠ Partial | Architecture supports it; full event-specific proof is missing.                |
| Linked motorcycles             | ⚠ Partial | Cross-links work where entities exist; source-backed participation is missing. |

### Race Overview

| Item                | Status     | Notes                                                                           |
| ------------------- | ---------- | ------------------------------------------------------------------------------- |
| Winner metric       | ✓ Complete | Manuel Lettenbichler is verified.                                               |
| Podium metric       | ✓ Complete | Podium order is verified.                                                       |
| Finishers metric    | ✓ Complete | 15 finishers verified.                                                          |
| Finish rate         | ✗ Missing  | Starter count is missing.                                                       |
| Terrain metric      | ✗ Missing  | Verified terrain description is null.                                           |
| Elevation metric    | ✗ Missing  | Verified elevation is null.                                                     |
| Distance metric     | ✗ Missing  | Verified distance is null.                                                      |
| Checkpoints metric  | ✗ Missing  | Verified checkpoint count is null.                                              |
| About card          | ⚠ Partial  | First-pass verified event description exists.                                   |
| Race format card    | ✗ Missing  | Verified event format is null.                                                  |
| Course card         | ✗ Missing  | Verified course/terrain text is null.                                           |
| Weather placeholder | ✗ Missing  | Weather data is supported by schema but not shown in current compact dashboard. |
| Official organizer  | ⚠ Partial  | Verified in data but not currently surfaced in compact public dashboard.        |

### Timeline

| Item                                   | Status     | Notes                                                                    |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| Timeline section                       | ✓ Complete | Compact timeline layout exists.                                          |
| Registration milestone                 | ⚠ Partial  | Milestone exists, date/status/details pending.                           |
| Prologue milestone                     | ⚠ Partial  | Milestone exists, date/status/details pending.                           |
| Main race milestone                    | ⚠ Partial  | Milestone exists, date/status/details pending.                           |
| Awards milestone                       | ⚠ Partial  | Milestone exists, date/status/details pending.                           |
| Official media release milestone       | ⚠ Partial  | Milestone exists, date/status/details pending.                           |
| Official results publication milestone | ⚠ Partial  | Milestone exists, date/status/details pending.                           |
| Stage control list                     | ⚠ Partial  | Supported by seeded event stages; official stage metadata is incomplete. |

### History

| Item                          | Status    | Notes                                                                                               |
| ----------------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| Previous editions list        | ⚠ Partial | UI supports previous editions, but historical source verification is not complete.                  |
| Previous winner               | ⚠ Partial | Manuel Lettenbichler is stored as previous winner marker, but historical source context is limited. |
| Event records preview         | ⚠ Partial | Uses available data and placeholders; fastest stage and best manufacturer are incomplete.           |
| Historical highlights         | ✗ Missing | Not currently source-verified for Erzbergrodeo 2026 page.                                           |
| Records achieved during event | ✗ Missing | Requires full official result/timing dataset.                                                       |

### Statistics

| Item               | Status     | Notes                                      |
| ------------------ | ---------- | ------------------------------------------ |
| Winner             | ✓ Complete | Verified.                                  |
| Podium             | ✓ Complete | Verified.                                  |
| Finishers          | ✓ Complete | Verified count only.                       |
| Starters           | ✗ Missing  | Official start list/classification needed. |
| Finish rate        | ✗ Missing  | Requires starters and finishers.           |
| Longest stage      | ✗ Missing  | Official course/stage data needed.         |
| Total distance     | ✗ Missing  | Official course data needed.               |
| Elevation gain     | ✗ Missing  | Official course data needed.               |
| Checkpoints        | ✗ Missing  | Official course data needed.               |
| Average stage time | ✗ Missing  | Requires official timing rows.             |

### Media

| Item                             | Status    | Notes                                                                                       |
| -------------------------------- | --------- | ------------------------------------------------------------------------------------------- |
| Hero image placeholder           | ⚠ Partial | Placeholder is ready; approved official image is missing.                                   |
| Media section on event dashboard | ✗ Missing | Resources/media block is intentionally not rendered in current public dashboard.            |
| Official gallery placeholder     | ⚠ Partial | Data placeholder exists, not displayed on compact dashboard.                                |
| Official YouTube link            | ⚠ Partial | Red Bull Motorsports channel exists as trusted media source, not event-specific video list. |
| Video cards                      | ✗ Missing | No verified event-specific video records.                                                   |
| Photographer/copyright metadata  | ✗ Missing | Media metadata architecture exists elsewhere, but no verified records for this event.       |

### Official Documents

| Item                                | Status    | Notes                                                                                         |
| ----------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| Official website                    | ⚠ Partial | Verified URL exists in data, not shown in compact public dashboard.                           |
| Regulations PDF                     | ✗ Missing | Placeholder exists, URL missing.                                                              |
| Entry list PDF                      | ✗ Missing | Placeholder exists, URL missing.                                                              |
| Final classification PDF            | ✗ Missing | Placeholder exists, URL missing.                                                              |
| Official result source link per row | ⚠ Partial | Source IDs exist in verified result data, but row-level public source display is not visible. |
| Document download UI                | ✗ Missing | Resources panel exists historically but is not rendered in current compact dashboard.         |

### Cross-links

| Item                | Status     | Notes                                                                                             |
| ------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| Rider profile links | ✓ Complete | Verified podium rows link to rider pages.                                                         |
| Manufacturer links  | ⚠ Partial  | Cross-links are supported where relations exist; source-backed event participation is incomplete. |
| Team links          | ⚠ Partial  | Cross-links are supported where relations exist; source-backed event participation is incomplete. |
| Motorcycle links    | ⚠ Partial  | Cross-links are supported where relations exist; source-backed bike usage is incomplete.          |
| Results module link | ✓ Complete | Present.                                                                                          |
| Events archive link | ✓ Complete | Breadcrumb and page context provide event navigation.                                             |

### Verified Sources

| Item                               | Status     | Notes                                                                                     |
| ---------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| Source registry entry              | ✓ Complete | `red-bull-erzbergrodeo-official` is configured as a primary source.                       |
| Source IDs on verified facts       | ✓ Complete | First-pass facts include source IDs.                                                      |
| Source IDs on verified podium rows | ✓ Complete | Result rows include source IDs.                                                           |
| Last reviewed                      | ✓ Complete | Last reviewed: 2026-06-30.                                                                |
| Confidence                         | ✓ Complete | High confidence for current first-pass scope.                                             |
| Public source status display       | ⚠ Partial  | Intentionally removed from public dashboard to reduce noise.                              |
| Raw source snapshots               | ✗ Missing  | Source tracking architecture exists, but no event-specific raw snapshot is attached here. |
| Official document URLs             | ✗ Missing  | Required for production-quality result/source audit trail.                                |

### Navigation

| Item                        | Status     | Notes                                                               |
| --------------------------- | ---------- | ------------------------------------------------------------------- |
| Sticky dashboard navigation | ✓ Complete | Uses phase-aware tab order.                                         |
| Completed race priority     | ✓ Complete | Results are first for completed races.                              |
| Equal-width tabs            | ✓ Complete | Navigation spans full content width.                                |
| Mobile scroll behavior      | ✓ Complete | Navigation supports horizontal overflow.                            |
| Anchor targets              | ✓ Complete | Results, Race Overview, Participants, Race Timeline, History exist. |

### UX

| Item                          | Status     | Notes                                                              |
| ----------------------------- | ---------- | ------------------------------------------------------------------ |
| Race dashboard structure      | ✓ Complete | Page is compact and results-first for completed race.              |
| Placeholder noise control     | ✓ Complete | Stage timing and unknown data use compact messages.                |
| Avoids empty tables           | ✓ Complete | Empty stage tables are hidden.                                     |
| Public source metadata hidden | ✓ Complete | Technical source card is not shown publicly.                       |
| Event status clarity          | ✓ Complete | Race status badge is clear.                                        |
| Production completeness       | ⚠ Partial  | UX shell is strong; content completeness depends on verified data. |

### Responsive

| Item                            | Status     | Notes                                                                                         |
| ------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| Hero responsive grid            | ✓ Complete | Hero adapts between stacked and two-column layouts.                                           |
| Results table responsive scroll | ✓ Complete | Overall table supports horizontal overflow.                                                   |
| Participant tabs wrap           | ✓ Complete | Tabs wrap on small screens.                                                                   |
| Dashboard nav mobile overflow   | ✓ Complete | Horizontal scrolling is supported.                                                            |
| Large typography fit            | ⚠ Partial  | Current design is solid; final visual QA should be performed with real full-length data rows. |

### Performance

| Item                   | Status     | Notes                                                                                           |
| ---------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| Server data loading    | ✓ Complete | Event detail page loads server-side.                                                            |
| No external requests   | ✓ Complete | Current page does not fetch external sources.                                                   |
| No heavy media assets  | ✓ Complete | Uses CSS placeholders.                                                                          |
| Database query breadth | ⚠ Partial  | Event detail query is broad but acceptable for current data size; future caching may be needed. |
| Cache strategy         | ✗ Missing  | Architecture plans caching, but event detail caching is not implemented for production scale.   |

### Accessibility

| Item                            | Status     | Notes                                                                                                |
| ------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| Semantic sections               | ✓ Complete | Major panels use sections and headings.                                                              |
| Keyboard links/buttons          | ✓ Complete | Navigation and links are keyboard-accessible.                                                        |
| Focus states                    | ✓ Complete | Shared components include focus styling.                                                             |
| Table semantics                 | ✓ Complete | Overall result table uses table markup.                                                              |
| Image placeholder alt semantics | ⚠ Partial  | CSS image placeholder is decorative; final official media should use explicit alt text.              |
| Emoji podium labels             | ⚠ Partial  | Visual medals are acceptable but should be reviewed with screen readers when final content is added. |

## Phase 2 - Missing Data Map

| Missing field or area                   | Official source                                             | Current status      | Supported by architecture?                    | Needs future source adapter?                 | Needs new verified entity?                                          |
| --------------------------------------- | ----------------------------------------------------------- | ------------------- | --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| Exact official date range               | Red Bull Erzbergrodeo Official, FIM calendar                | Partial             | Yes                                           | HTML/PDF adapter likely                      | No                                                                  |
| Round number                            | FIM calendar, official championship calendar                | Partial             | Yes                                           | Events connector/HTML adapter                | No                                                                  |
| Elevation                               | Red Bull Erzbergrodeo Official, official event guide        | Missing             | Yes                                           | HTML/PDF adapter                             | No                                                                  |
| Terrain description                     | Red Bull Erzbergrodeo Official, official event guide        | Missing             | Yes                                           | HTML/PDF adapter                             | No                                                                  |
| Course distance                         | Official event guide, regulations PDF                       | Missing             | Yes                                           | PDF/HTML adapter                             | No                                                                  |
| Elevation gain                          | Official course/event guide                                 | Missing             | Yes                                           | PDF/HTML adapter                             | No                                                                  |
| Number of checkpoints                   | Official event guide, final classification, regulations PDF | Missing             | Yes                                           | PDF/HTML/timing adapter                      | No                                                                  |
| Event format                            | Official regulations, event guide                           | Missing             | Yes                                           | PDF/HTML adapter                             | No                                                                  |
| Prologue explanation                    | Official schedule/regulations                               | Missing             | Yes                                           | PDF/HTML adapter                             | No                                                                  |
| Main race explanation                   | Official schedule/regulations                               | Missing             | Yes                                           | PDF/HTML adapter                             | No                                                                  |
| Weather                                 | Official weather snapshot provider or trusted weather API   | Missing             | Yes, WeatherSnapshot exists                   | Future weather connector                     | No                                                                  |
| Full official event description         | Red Bull Erzbergrodeo Official                              | Partial             | Yes                                           | HTML adapter                                 | No                                                                  |
| Official organizer details              | Red Bull Erzbergrodeo Official                              | Partial             | Yes                                           | HTML adapter                                 | No                                                                  |
| Official social URLs                    | Official event website/social profiles                      | Missing             | Yes                                           | HTML/manual verified source                  | No                                                                  |
| Approved hero image                     | Official media gallery/press kit                            | Missing             | Media architecture exists                     | Media/HTML adapter later                     | No, unless media entity needs approved asset state                  |
| Photographer/copyright/license metadata | Official media gallery/press kit                            | Missing             | Media metadata model exists                   | Media adapter later                          | No                                                                  |
| Official YouTube event videos           | Red Bull Motorsports YouTube, event official channels       | Missing             | YouTube connector foundation exists           | YouTube connector review flow                | No                                                                  |
| Regulations PDF URL                     | Official event website/FIM                                  | Missing             | Yes                                           | PDF/document adapter                         | No                                                                  |
| Entry list PDF URL                      | Official event website/FIM/timing provider                  | Missing             | Yes                                           | PDF/document adapter                         | No                                                                  |
| Final classification PDF URL            | Official event website/FIM/timing provider                  | Missing             | Yes                                           | PDF/document adapter                         | No                                                                  |
| Raw source snapshots                    | Official source URL, PDF, CSV/timing export                 | Missing             | SourceSnapshot/ImportRun architecture exists  | Adapter-specific snapshot flow               | No                                                                  |
| Full overall classification             | Official final classification PDF/CSV/timing export         | Partial: top 3 only | Yes                                           | PDF/CSV/HTML results adapter                 | No                                                                  |
| Remaining 12 finisher identities        | Official final classification PDF/CSV/timing export         | Missing             | Yes                                           | PDF/CSV/HTML results adapter                 | No                                                                  |
| DNF rows                                | Official final classification PDF/CSV/timing export         | Missing             | Yes                                           | Results adapter                              | No                                                                  |
| DNS rows                                | Official entry/start/final classification                   | Missing             | Yes                                           | Results adapter                              | No                                                                  |
| DSQ rows                                | Official final classification                               | Missing             | Yes                                           | Results adapter                              | No                                                                  |
| Total time                              | Official final classification/timing export                 | Missing             | Yes                                           | Timing CSV/PDF/HTML adapter                  | No                                                                  |
| Gap to leader                           | Official final classification/timing export                 | Missing             | Yes                                           | Timing CSV/PDF/HTML adapter                  | No                                                                  |
| Gap to previous                         | Official final classification/timing export                 | Missing             | Yes                                           | Timing CSV/PDF/HTML adapter                  | No                                                                  |
| Penalties                               | Official final classification/timing export                 | Missing             | Yes                                           | Timing CSV/PDF/HTML adapter                  | No                                                                  |
| Points                                  | FIM standings or official event classification              | Missing             | Yes                                           | Results/standings adapter                    | No                                                                  |
| Stage timing rows                       | Official timing export/PDF                                  | Missing             | Yes                                           | Timing CSV/PDF/HTML adapter                  | No                                                                  |
| Prologue results                        | Official timing export/PDF                                  | Missing             | Yes                                           | Timing adapter                               | No                                                                  |
| Day 1 results                           | Official timing export/PDF                                  | Missing             | Yes                                           | Timing adapter                               | No                                                                  |
| Day 2 results                           | Official timing export/PDF                                  | Missing             | Yes                                           | Timing adapter                               | No                                                                  |
| Day 3 results                           | Official timing export/PDF                                  | Missing             | Yes                                           | Timing adapter                               | No                                                                  |
| Stage winner per stage                  | Official timing export/PDF                                  | Missing             | Yes                                           | Timing adapter                               | No                                                                  |
| Best time per stage                     | Official timing export/PDF                                  | Missing             | Yes                                           | Timing adapter                               | No                                                                  |
| Stage DNF count                         | Official timing export/PDF                                  | Missing             | Yes                                           | Timing adapter                               | No                                                                  |
| Registered rider count                  | Official entry list                                         | Missing             | Yes                                           | PDF/HTML adapter                             | No                                                                  |
| Confirmed starters                      | Official start list                                         | Missing             | Yes                                           | PDF/HTML adapter                             | No                                                                  |
| Full rider participant list             | Official entry/start/final classification                   | Partial             | Yes                                           | PDF/HTML/results adapter                     | No                                                                  |
| Rider country for all participants      | Official classification/entry list                          | Partial             | Yes                                           | Results/entry adapter                        | No                                                                  |
| Rider team for event                    | Official entry list/team release                            | Missing             | Yes                                           | Entry/team adapter or manual verified source | Possibly if event-specific team membership history is insufficient  |
| Rider manufacturer for event            | Official entry list/classification/team release             | Partial             | Yes                                           | Results/entry adapter                        | No                                                                  |
| Rider motorcycle for event              | Official entry list/team/manufacturer source                | Missing             | Yes                                           | Entry/team/manufacturer adapter              | No                                                                  |
| Factory/private classification          | Official team/entry/paddock sources                         | Missing             | Data can be represented as verified facts now | Manual verified source or HTML adapter       | Possibly if long-term event-entry model needs richer classification |
| Manufacturer participation list         | Official entry/classification                               | Missing             | Yes                                           | Results/entry adapter                        | No                                                                  |
| Team participation list                 | Official entry/classification/team releases                 | Missing             | Yes                                           | Entry/results adapter                        | Possibly if event-specific team entry model is needed               |
| Motorcycle models used                  | Official entry list/team/manufacturer releases              | Missing             | Yes                                           | Entry/team/manufacturer adapter              | No                                                                  |
| Historical editions and winners         | Red Bull Erzbergrodeo Official, FIM archive                 | Partial             | Yes                                           | HTML/PDF adapter                             | No                                                                  |
| Historic highlights                     | Official event history/media                                | Missing             | Verified fact architecture can store text     | HTML/manual verified source                  | No                                                                  |
| Event records achieved                  | Official timing/result archive                              | Missing             | Statistics/records architecture exists        | Results/timing adapter first                 | No                                                                  |
| Public source display per result row    | Existing source IDs and DataVersion architecture            | Partial             | UI can support it later                       | No adapter needed                            | No                                                                  |
| Event-detail cache policy               | Platform/Vercel/Redis strategy                              | Missing             | Architecture planned                          | No source adapter                            | No                                                                  |
| Final accessibility QA with real media  | Official media assets                                       | Missing             | UI supports it                                | No source adapter                            | No                                                                  |

## Priority Roadmap

1. Attach official source documents and URLs.
   - Final classification PDF or timing export.
   - Entry/start list.
   - Regulations or event guide.
   - Official media gallery/press kit.

2. Complete official classification.
   - Add all 15 verified finishers.
   - Add DNF/DNS/DSQ rows if official classification includes them.
   - Add times, gaps, penalties, status, and points only if present in official sources.

3. Complete stage/timing history.
   - Prologue, Day 1, Day 2, Day 3 if available.
   - Stage winners, best times, gaps, DNFs, checkpoints.

4. Complete participant context.
   - Registered riders.
   - Starters.
   - Rider/team/manufacturer/motorcycle entries.
   - Factory/private classification only from official sources.

5. Complete course and event context.
   - Terrain, elevation, distance, elevation gain, checkpoints.
   - Event format, prologue/main-race explanations.
   - Weather snapshot if reliable source is available.

6. Complete official media/documents.
   - Approved hero image and gallery assets with attribution.
   - Official videos through review-first YouTube workflow.
   - Regulations, entry list, final classification PDFs.

7. Production QA pass.
   - Responsive screenshots with full real data.
   - Screen-reader and keyboard pass.
   - Performance/caching decision for event detail pages.
