# Parameter Reference

Key options (see `docs/USAGE.md` for full list):
- `--read` / `--write`: consumer or producer (default write).
- `--framesize`: preset (e.g., `dpx-4k-10`, `exr-4k-16f`, `png-4k-16`, `hdtv`) or bytes with k/K/m/M/g/G suffix.
- `--frames`: total frames (0 = until interrupted).
- `--frames-per-file`: group frames per file (default 1).
- `--framerate`: fps cap (async only).
- `--queue-depth`: async depth (0 = sync).
- `--iosize`: sync chunk size.
- `--prefix`: filename prefix.
- `--stats-interval`: ms between stats.
- `--json`: NDJSON output.
- `--label`: tag outputs.
- `--checksum`: per-file checksum.
- `--warmup-frames`: frames excluded from stats.
- `--duration`: max runtime (seconds).
- `--percentiles`: comma-separated latency percentiles.
- `--histogram`: include latency histogram in JSON.

Frame size formulas and presets: see `docs/FORMATS.md`.
