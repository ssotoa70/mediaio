# Contributing

## How to Contribute
1. Fork/branch from `main`.
2. Keep changes small and scoped; use Conventional Commits.
3. Add/adjust tests for new functionality (`npm test`).
4. Run `npm run build` before PR.
5. Open a PR with description, acceptance criteria, and links to issues/board cards.

## Code Style
- TypeScript, ES modules, strict mode.
- Use `npm run lint` (when added) and Prettier defaults.
- Prefer async/await, avoid broad `any`.

## Branch/PR Guidelines
- Branch naming: `feat/...`, `fix/...`, `chore/...`.
- PR template required (see `.github/PULL_REQUEST_TEMPLATE.md`).
- Request review from CODEOWNERS.

## Testing
- Unit tests: `npm test`.
- Include small integration checks for CLI options when possible.

## Issue Reporting
- Use issue templates for bugs/features.
- Provide reproduction steps and expected vs actual behavior.
