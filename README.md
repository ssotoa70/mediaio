# MediaIO

CLI to benchmark media-style frame I/O (producer/consumer) similar to `vidio`.

## Status
- PRD drafted in `apps/mediaIO/PRD.md`.
- MVP CLI implemented (producer/consumer, per-stream + aggregate stats, filesystem detection). Tests cover parsing helpers.

## Usage
```bash
# install deps
npm --prefix apps/mediaIO install

# write frames into ./out (default mode is write)
npm --prefix apps/mediaIO run cli -- ./out --framesize hdtv --frames 100

# read back and verify
npm --prefix apps/mediaIO run cli -- --read ./out

# async write with queue depth and frame rate
npm --prefix apps/mediaIO run cli -- ./out --framerate 60 --queue-depth 4

# NDJSON stats (aggregate + per-stream) tagged with a label
npm --prefix apps/mediaIO run cli -- ./out --frames 100 --json --label nfs-test

# list cinematic frame presets
npm --prefix apps/mediaIO run cli -- --list-presets

# enable checksums (write & verify; adds CPU overhead)
npm --prefix apps/mediaIO run cli -- ./out --frames 100 --checksum
```

Key options:
- `--read` / `--write`: choose consumer or producer (default write).
- `--framesize`: frame preset (`dpx-4k-10`, `exr-4k-16f`, `tiff-4k-16`, `png-4k-16`, `hdtv`, etc.) or bytes with k/K/m/M/g/G suffix.
  - See `apps/mediaIO/FORMATS.md` for preset formulas and assumptions.
- `--frames`: total frames (0 = run until interrupted).
- `--frames-per-file`: frames grouped per file (default 1).
- `--framerate`: target fps (async only).
- `--queue-depth`: async pipeline depth (0 = synchronous).
- `--iosize`: chunked I/O size for synchronous mode.
- `--prefix`: filename prefix (default `mediaio`).
- `--stats-interval`: milliseconds between stats prints (default 1000).
- `--json`: emit NDJSON snapshots instead of text (aggregate + per-stream).
- `--label`: tag runs (included in text and JSON output).
- `--checksum`: compute and verify per-file checksums (optional; adds CPU overhead).

The tool auto-detects filesystem type (local vs network) on best-effort basis and includes it in the run header and JSON output. Per-stream and aggregate stats include fps, throughput, bytes, dropped frames, errors, and latency percentiles (min/p50/p75/p90/p95/p99/p99.9).

### Shared storage (NFS/SMB) recipe
```bash
# example: stress an NFS/SMB mount with async writes and JSON metrics
npm --prefix apps/mediaIO run cli -- /mnt/share --framesize hdtv --frames 1000 \
  --queue-depth 4 --framerate 120 --stats-interval 1000 --json --label nfs-bench
```

If multiple directories are provided (multiple mounts), per-stream stats will be reported for each path in both text and JSON modes.
