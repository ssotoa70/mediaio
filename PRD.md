# MediaIO PRD

## Purpose
- Build a CLI tool to benchmark video-frame style I/O (producer/consumer) similar to `vidio`, to measure throughput, latency, and dropped frames across directories and storage configs.

## Background
- `vidio` generates fixed-size frames and writes numbered files; in consumer mode it reads them back and reports performance. We want a modern, scriptable Node-based version that fits this repo and can extend to richer telemetry.

## Target Users
- Infra and storage engineers validating disk/network throughput.
- App developers needing repeatable media-like I/O load during local or CI profiling.

## Goals (MVP)
- CLI runnable via `node`/`npm` script under `apps/mediaIO`.
- Producer (write) and consumer (read) modes.
- Configurable frame size (presets and raw bytes), frame count, frames per file, prefix, directories (multi-stream).
- Optional frame rate cap (async mode only) and dropped-frame tracking.
- Async queue depth for pipelined I/O; sync mode with adjustable I/O size.
- Performance stats to stdout: throughput (MB/s), frames/s, latency min/p50/p95/p99, drops.
- Exit with non-zero on read errors or incomplete writes.

## Non-Goals (initial)
- Fancy curses/TUI display (may add later).
- Network copying or transcoding.
- Video container/codecs; frames are opaque bytes (future work: optional container/essence validation for NLE workflows).

## Success Metrics
- Writes: achieves target frame rate within 5% on local SSD at default sizes; zero write errors.
- Reads: byte-accurate counts with zero mismatches; drops reported when frame cap exceeded.
- CI run completes < 30s at default settings.

## Functional Requirements
- **Modes**: `--write` (default) creates files; `--read` consumes previously written frames.
- **Directories**: accept 1..N dir paths; spawn independent streams.
- **Frame size**: presets (e.g., `hdtv`, `uhd`, `4k`) and byte input with k/K/m/M/g/G suffix.
- **Frame count**: total frames; `0` means run-until-interrupt.
- **Frames per file**: group frames in files; default 1.
- **Frame rate cap**: limit frames/s per stream in async mode; count drops when storage lags.
- **Queue depth**: async pipeline depth; `0` forces sync mode.
- **I/O size**: sync read/write chunk size override (default frame size).
- **Prefix**: filename prefix before `_NNNNNNN` counter.
- **Stats**: periodic stdout summary interval (configurable, default 1s).
- **Verification (read)**: validate file size and bytes read; surface mismatches with counts.
- **Exit codes**: non-zero on argument errors, I/O failures, or verification failures.

## Technical Approach
- Node/TypeScript CLI (likely `ts-node` or bundled via `npm run mediaIO`).
- Use `fs/promises` for async pipelines; limit concurrency via queue depth.
- Frame buffer: zero-filled `Buffer.alloc()` reused when possible.
- Stats ticker: shared collector with high-resolution timers; print JSON-ish lines for easy parsing.
- Testing: add unit tests for option parsing and sizing math; add a short integration sanity under `tests/` gated to small frame sizes.
- Auto-detect filesystem type and whether it is local (e.g., APFS/NTFS/ext4) or network (NFS/SMB) to annotate results; keep detection cross-platform and non-fatal if unsupported.

## Risks / Open Questions
- Large file counts may stress filesystem metadata; consider optional cleanup flag.
- Cross-platform direct I/O parity is limited; may skip `O_DIRECT` and document.
- Need to ensure multi-directory throughput reporting stays clear (per-stream vs aggregate).

## Milestones
1) Scaffolding: CLI skeleton, argument parsing, dry-run stats.
2) Producer path: writing with queue depth and periodic stats.
3) Consumer path: reading with verification and stats.
4) Tests + doc: README usage, presets list, CI-friendly default run.
