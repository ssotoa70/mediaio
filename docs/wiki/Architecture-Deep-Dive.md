# Architecture Deep Dive

- Overview diagram: see `../ARCHITECTURE.md` and `../../assets/architecture.mmd`.
- Core modules: CLI (`src/index.ts`), runner (`src/runner.ts`), stats (`src/stats.ts`), filesystem detection (`src/filesystem.ts`), formats/presets (`src/formats.ts`), checksum (`src/checksum.ts`).
- Data flow: CLI → runner → per-dir streams → I/O (write/read) → optional checksum → stats collector → text/NDJSON reporter → logs.
- Key behaviors:
  - Warm-up frames excluded from stats; optional duration cap stops loops.
  - Queue depth controls async; iosize applies only to sync mode.
  - Percentiles configurable; histogram optional (JSON only).
  - Filesystem detection is best-effort, non-fatal.
