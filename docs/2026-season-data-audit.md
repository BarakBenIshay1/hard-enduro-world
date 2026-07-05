# 2026 Season Data Audit

Scope: repository seed and verified-data layer only. No external sources were queried for
this audit.

## Current 2026 Events In The Database

Seed source: `prisma/seed.ts`.

| Event                      | Slug                         | Country / Location In Seed   | Current Data Status                                                         |
| -------------------------- | ---------------------------- | ---------------------------- | --------------------------------------------------------------------------- |
| Minus 400 2026             | `minus-400-2026`             | Israel / Arad                | Partial metadata only. Results not verified.                                |
| Valleys Hard Enduro 2026   | `valleys-hard-enduro-2026`   | United Kingdom / South Wales | Partial metadata only. Results not verified.                                |
| XL Lagares 2026            | `xl-lagares-2026`            | Portugal / Porto             | Partial metadata only. Results not verified.                                |
| Red Bull Erzbergrodeo 2026 | `erzbergrodeo-2026`          | Austria / Eisenerz           | Partial verified event. Podium and 15 finishers verified first-pass.        |
| Abestone Hard Enduro 2026  | `abestone-hard-enduro-2026`  | Italy / Abetone              | Calendar metadata only. Seed marks live/demo status; needs official review. |
| Red Bull Romaniacs 2026    | `red-bull-romaniacs-2026`    | Romania / Sibiu              | Scheduled metadata only.                                                    |
| Xross Hard Enduro 2026     | `xross-hard-enduro-2026`     | Serbia / Zlatibor            | Scheduled metadata only.                                                    |
| Red Bull Outliers 2026     | `red-bull-outliers-2026`     | Canada / Calgary             | Scheduled metadata only.                                                    |
| Tennessee Knockout 2026    | `tennessee-knockout-2026`    | United States / Sequatchie   | Scheduled metadata only.                                                    |
| Sea to Sky 2026            | `sea-to-sky-2026`            | Turkey / Kemer               | Scheduled metadata only.                                                    |
| Hixpania Hard Enduro 2026  | `hixpania-hard-enduro-2026`  | Spain / Aguilar de Campoo    | Scheduled metadata only.                                                    |
| GetzenRodeo 2026           | `getzenrodeo-2026`           | Germany / Griesbach          | Scheduled metadata only.                                                    |
| Roof of Africa 2026        | `roof-of-africa-2026`        | South Africa / Maseru        | Scheduled metadata only. Needs championship-calendar verification.          |
| Wildwood Rock Extreme 2026 | `wildwood-rock-extreme-2026` | Australia / Melbourne        | Scheduled metadata only. Needs championship-calendar verification.          |
| Terra Inferno 2026         | `terra-inferno-2026`         | Mexico / Monterrey           | Scheduled metadata only. Needs championship-calendar verification.          |

## Current Riders In The Database

Seed source: `prisma/seed.ts`.

- Total rider profiles: 60.
- Featured rider profiles: 12.
- Additional named rider profiles: 24.
- Regional demo/profile riders: 24, all prefixed with `demo-`.
- Verified rider result entries: Manuel Lettenbichler, Trystan Hart, and Mario Roman only, each tied to Red Bull Erzbergrodeo 2026 first-pass podium data.

Featured riders currently seeded:

- Manuel Lettenbichler
- Billy Bolt
- Mario Roman
- Wade Young
- Teodor Kabakchiev
- Trystan Hart
- Jonny Walker
- Graham Jarvis
- Michael Walkner
- Alfredo Gomez
- Dominik Olszowy
- Mitch Brightmore

Status:

- Rider profile entities exist and can support pages.
- Most rider facts are profile placeholders, not verified biographies or career records.
- Career totals, standings, and historical results should remain empty or conservative until verified.

## Current Teams

Seed source: `prisma/seed.ts`.

Primary seeded teams:

- Red Bull KTM Factory Racing
- Husqvarna Factory Racing
- Factory Sherco Racing
- Rieju Factory Racing
- FMF KTM Factory Racing
- Beta Factory Racing
- GASGAS Factory Racing
- TM Racing Enduro
- Privateer Hard Enduro

Additional profile/demo teams:

- Sherco Privateer Racing
- Moto Club Romania
- Alpine Hard Enduro
- Iberian Extreme Racing
- Nordic Enduro Lab
- Balkan Hard Enduro
- Carpathian Privateers
- Rookie Hard Enduro Academy
- Desert Hard Enduro Team
- Andes Extreme Racing
- Pacific Hard Enduro
- North American Privateers
- Junior Factory Program

Status:

- Team records support navigation and relationship display.
- Team rosters and current factory status need official verification before being treated as historical facts.

## Current Manufacturers

Seed source: `prisma/seed.ts`.

- KTM
- Husqvarna
- GASGAS
- Sherco
- Beta
- Rieju
- TM Racing
- Honda
- Fantic

Status:

- Manufacturer entities are present.
- Manufacturer performance, championship wins, rider usage, and 2026 factory participation are not fully verified.

## Current Motorcycle Models

Seed source: `prisma/seed.ts`.

- KTM 300 EXC 2026
- KTM 300 XC-W 2026
- Husqvarna TE 300 2026
- GASGAS EC 300 2026
- Sherco 300 SE Factory 2026
- Beta RR 300 Racing 2026
- Rieju MR 300 Racing 2026
- TM Racing EN 300 2026
- Honda CRF450RX 2026
- Fantic XE 300 2026

Status:

- Model entities exist for UI and relationship structure.
- Technical specs are demo/profile values and should be verified against official manufacturer material before publication as facts.

## Complete / Partial / Missing Summary

| Area                                  | Status  | Notes                                                                                 |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| 2026 season entity                    | Partial | Exists as active season. Official calendar alignment still needs review.              |
| 2026 event metadata                   | Partial | Seeded for 15 events. Official championship inclusion needs review per event.         |
| Erzbergrodeo 2026 overall podium      | Partial | P1 Manuel Lettenbichler, P2 Trystan Hart, P3 Mario Roman verified first-pass.         |
| Erzbergrodeo 2026 full classification | Missing | Only podium rows exist. Remaining 12 finishers are not identified.                    |
| Erzbergrodeo 2026 timing/gaps/points  | Missing | Explicitly null in verified data.                                                     |
| Stage results                         | Missing | `verifiedStageResults` is empty.                                                      |
| 2026 standings                        | Missing | Should be calculated later from approved official results.                            |
| Rider biographies                     | Missing | Profiles exist, but biographies need official or trusted source review.               |
| Rider/team/manufacturer relationships | Partial | Seeded relationships exist, but require source verification for 2026 factual display. |
| Motorcycle specifications             | Partial | Model/spec structures exist; values need manufacturer-source verification.            |
| Media/profile images                  | Missing | No approved rider or event imagery should be used yet.                                |

## Suspected Mismatches / Review Flags

- The 2026 seed includes events that may not all belong to the official current FIM Hard Enduro World Championship calendar. Verify every event against FIM and official championship calendar sources before treating it as official.
- `Abestone Hard Enduro 2026` is marked as live/demo by seed behavior. This should be checked against the real event status before production use.
- `Roof of Africa`, `Wildwood Rock Extreme`, and `Terra Inferno` may be valid hard enduro events, but their inclusion in the 2026 championship calendar needs official-source confirmation.
- Team and motorcycle assignments are useful for page structure but should not be treated as verified 2026 contracts or entries until checked.
- Regional `demo-*` rider profiles should stay clearly separated from verified rider facts.
- Existing official URLs in some seed records use `example.com/demo/...`; these must not be used as public official sources.

## Next Recommended Verified Sources To Check

Priority order:

1. FIM official Hard Enduro World Championship 2026 calendar.
2. Official Hard Enduro World Championship website/calendar.
3. Red Bull Erzbergrodeo official result/classification source for full 2026 results.
4. Red Bull Erzbergrodeo official entry list/start list for riders, teams, manufacturers, motorcycles, starters, DNFs, DNS, and DSQ.
5. KTM / Red Bull KTM official rider profile for Manuel Lettenbichler.
6. Official manufacturer/team profile pages for KTM, Husqvarna, Sherco, GASGAS, Beta, Rieju, TM Racing, Honda, and Fantic.
7. Official timing exports, PDFs, or classification documents for completed 2026 events.
8. Trusted official media channels only for media references, not race-result facts.

## Recommended Next Work

1. Complete the Manuel Lettenbichler pilot using official profile, team, bike, and Erzbergrodeo result sources.
2. Complete Erzbergrodeo 2026 full official classification before adding another event.
3. Verify the 2026 event calendar and remove or mark non-championship events before adding standings.
4. Keep standings/statistics/records empty until approved results can drive calculations.
