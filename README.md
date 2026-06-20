# Hard Enduro World

Production-grade Hard Enduro World Championship knowledge base built with Next.js, React, TypeScript, Tailwind CSS, Supabase, PostgreSQL, Prisma, Redis/Upstash, Playwright, and GitHub Actions.

## Current Stage

Step 2 foundation only:

- Next.js App Router shell
- TypeScript and Tailwind CSS
- Prisma schema foundation
- Docker Compose for PostgreSQL and Redis
- GitHub Actions CI
- ESLint, Prettier, Husky, Commitlint
- Environment validation

Feature pages, admin tools, automation jobs, charts, maps, AI services, and media workflows come later.

## Local Development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Start local services with `docker compose up -d`.
4. Run database migration with `npm run db:migrate`.
5. Start the app with `npm run dev`.

## Quality Checks

- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run test:e2e`
