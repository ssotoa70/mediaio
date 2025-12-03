# Usage

## Basic Commands
```bash
# build
npm run build

# write frames (default mode)
npm run cli -- ./out --framesize dpx-4k-10 --frames 100

# read and verify
npm run cli -- --read ./out --framesize dpx-4k-10 --frames 100

# async write with queue depth and framerate cap
npm run cli -- ./out --framerate 60 --queue-depth 4

# list presets
npm run cli -- --list-presets
```

## Options (common)
- `--read` / `--write`: consumer or producer (default write).
- `--framesize`: preset (e.g., `dpx-4k-10`, `exr-4k-16f`, `png-4k-16`, `hdtv`) or bytes with k/K/m/M/g/G suffix.
- `--frames`: total frames (0 = until interrupted).
- `--frames-per-file`: group frames per file (default 1).
- `--framerate`: fps cap (async only).
- `--queue-depth`: async depth (0 = synchronous).
- `--iosize`: sync chunk size.
- `--prefix`: filename prefix (default `mediaio`).
- `--stats-interval`: ms between stats prints (default 1000).
- `--json`: NDJSON stats (aggregate + per-stream).
- `--label`: tag outputs.
- `--checksum`: per-file SHA-256 write+verify (adds CPU overhead).
- `--warmup-frames`: frames excluded from stats.
- `--duration`: max runtime in seconds.
- `--percentiles`: comma-separated latency percentiles (default `50,75,90,95,99,99.9`).
- `--histogram`: include latency histogram in JSON output.

## Shared Storage Recipe (NFS/SMB)
```bash
npm run cli -- /mnt/share --framesize dpx-4k-10 --frames 1000 \
  --queue-depth 4 --framerate 120 --stats-interval 1000 \
  --json --label nfs-bench --warmup-frames 50 --duration 60
```

## Interpreting Output
- Text: shows fps, throughput, latency (min/p50/p90/p99), drops/errors.
- JSON: includes latency percentiles map, optional histogram, filesystem info, warmup/duration settings.

## Presets & Formulas
See `docs/FORMATS.md` for cinematic presets and frame-size formulas.
