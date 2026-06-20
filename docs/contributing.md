# Contributing

## Branch Strategy

- `main` should always represent deployable code.
- Feature branches should use short descriptive names such as `feature/event-shell`.
- Infrastructure branches should use names such as `chore/ci-foundation`.

## Commit Style

Use conventional commits:

- `feat: add event timing table`
- `fix: correct rider slug redirect`
- `chore: update ci workflow`
- `docs: expand architecture notes`

## Before Opening A Pull Request

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run format:check`.
- Add or update tests when behavior changes.
