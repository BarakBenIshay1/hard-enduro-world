# Production Source Registry

The Production Source Registry is the single source of truth for official and
trusted information sources used by Hard Enduro World.

It does not fetch, scrape, sync, validate URLs, publish data, or write to the
database. It describes what each source is allowed to provide so future
connectors, automation jobs, review tools, and public entities can use the same
source rules.

Code location:

```text
lib/source-intelligence/registry/
```

## Registry Philosophy

Every connector must read source configuration from the registry instead of
hardcoding source metadata.

The registry answers:

- Is this source enabled?
- What is the official display name?
- Which entity types can it update?
- Which update types are allowed?
- Which content types can it provide?
- How often may it run?
- Does it require manual approval?
- What retry and backoff policy should it use?
- Who owns the source?
- Where is its documentation?

The registry is source metadata only. A source entry does not mean data from
that source has been imported, verified, or published.

## Registry Lifecycle

```text
source proposed
  -> source entry added
  -> capabilities declared
  -> validation checks run
  -> connector may read registry
  -> connector produces dry-run output
  -> review rules decide what happens next
```

No source should be used by a connector until it has:

- stable unique id
- display name
- official name
- source category
- priority
- confidence level
- review policy
- supported entity types
- supported content types
- supported update types
- refresh frequency
- retry/backoff policy
- owner
- notes

## Source Categories

Supported categories:

- Official Championship
- Official Event
- Official Manufacturer
- Official Team
- Official Rider
- Official Media
- Trusted Creator
- Official Timing
- Official Documents
- Official Maps
- Official Social

Category controls how the platform thinks about authority. For example, an
official event source may be trusted for event documents and results, while a
trusted creator may be trusted only for reviewed media references.

## Capability Rules

Every source declares:

- supported entity types
- supported content types
- supported update types

Examples:

- A championship source may support calendar, standings, and documents.
- An event source may support calendar, results, timing, maps, media, videos,
  and documents.
- A manufacturer source may support manufacturer profiles, team assignments,
  motorcycle assignments, and rider profile context.
- A trusted creator source may support media/videos only.
- Social sources are registry-only until a separate policy approves usage.

Connectors must refuse updates outside the source capabilities.

## How Connectors Use It

Before a connector runs, it should ask:

- Is the source registered?
- Is the source enabled?
- Can this source update this entity type?
- Can this source provide this content type?
- Can this source perform this update type?
- How often may this source run?
- What retry/backoff policy applies?
- Does this source require manual approval?

Reusable helpers live in:

```text
lib/source-intelligence/registry/helpers.ts
```

The key rule:

```text
No connector output should be accepted if the source is not authorized for that
entity/content/update type.
```

## How Review Uses It

Review tools should use the registry to decide:

- priority of the review item
- whether manual approval is required
- whether the source is strong enough for the proposed fact
- whether a media-only source is trying to update official sporting data
- whether conflicting sources should block approval

All high-risk updates still require review:

- results
- timing
- standings
- participants
- rider biographies
- team assignments
- manufacturer assignments
- motorcycle assignments
- course maps
- documents
- history

## Priority Rules

Suggested priority interpretation:

- Critical
  - Championship authority, official timing, official event result sources.
- High
  - Official event, manufacturer, team, and rider sources.
- Medium
  - Official media and trusted creators.
- Low
  - Social sources and registry-only media discovery sources.

Priority should guide review order. It should not bypass review.

## Conflict Resolution Rules

When sources conflict:

- Official timing/export beats article summaries for result rows.
- Official final PDFs beat provisional/live timing.
- Championship sources beat secondary copied calendar text.
- Official event sources beat media recaps for event details.
- Manufacturer/team/rider sources can confirm profile relationships but should
  not override official results.
- Trusted creators cannot create or override results, timing, standings, or
  records.
- Social sources cannot override official sources.
- Conflicts should create review items, not automatic overwrites.

## Future Sources

To add a new source:

1. Create a registry entry in `lib/source-intelligence/registry/entries.ts`.
2. Assign a stable id.
3. Choose the correct source category.
4. Declare supported entity types.
5. Declare supported content types.
6. Declare supported update types.
7. Set priority and confidence.
8. Set review policy.
9. Set refresh frequency.
10. Set retry/backoff policy.
11. Add owner, tags, documentation reference, and notes.
12. Run registry validation.

Do not build a connector until the source capabilities are clear.

## Initial Registry Scope

The initial production registry includes:

- FIM Hard Enduro World Championship
- Official Hard Enduro World Championship
- Red Bull Erzbergrodeo
- Red Bull Romaniacs
- Sea to Sky
- Xross Hard Enduro
- Abestone Hard Enduro
- Tennessee Knockout
- KTM Factory Racing
- Husqvarna Factory Racing
- Sherco Factory Racing
- Beta Factory Racing
- GASGAS Factory Racing
- Rieju Racing
- TM Racing
- Media Mike TV
- 2PRO1SLOW
- Red Bull Motorsports
- Official YouTube channel registry entries
- Official Instagram registry entries

These entries do not fetch, validate, or publish anything. They only define
future authority and capability boundaries.

## Non-Goals

This registry does not:

- scrape websites
- call APIs
- validate URLs
- run cron jobs
- sync data
- change Prisma
- change the database schema
- change seed data
- approve data
- publish data
- create public UI

It is infrastructure for safe future automation.
