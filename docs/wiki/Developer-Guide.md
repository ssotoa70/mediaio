# Developer Guide

## Code Layout
- CLI: `src/index.ts`
- Runner: `src/runner.ts`
- Stats: `src/stats.ts`
- Formats/presets: `src/formats.ts`
- Filesystem detection: `src/filesystem.ts`
- Checksums: `src/checksum.ts`
- Tests: `tests/`

## Common Tasks
- Add CLI options: update `src/index.ts`, validate inputs, document in `docs/USAGE.md`.
- Add presets: update `src/formats.ts` and `docs/FORMATS.md`.
- Add metrics: extend `src/stats.ts` and JSON/text output in `src/runner.ts`.

## Commands
```bash
npm test
npm run build
npm run cli -- --list-presets
```

## Style
- TypeScript ES modules, strict mode.
- Conventional Commits for PRs; see `docs/CONTRIBUTING.md`.
