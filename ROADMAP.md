# MediaIO Roadmap

This roadmap tracks planned, in-progress, and completed work with a focus on reliable media workload benchmarking on shared storage (NFS/SMB) and local filesystems.

## Principles
- Validate ideas before building: define goal, success criteria, and measurement plan per item.
- Prefer incremental changes with tests and docs.
- Keep outputs machine-readable (`--json`) and human-readable for quick inspection.
- Prioritize accuracy (integrity checks, timing) over micro-optimizations.

## Status Legend
- ✅ Done
- 🔄 In Progress
- 📝 Planned
- 🧪 Validate idea/approach before implementation

## Completed
- ✅ MVP CLI with producer/consumer, per-stream + aggregate stats, latency percentiles (min/p50/p75/p90/p95/p99/p99.9), filesystem detection, NDJSON output (`--json`, `--label`).
- ✅ Sync chunked I/O (`--iosize`) and async queue depth (`--queue-depth`).
- ✅ Shared storage recipe documented in README.
- ✅ Frame-based cinematic presets (DPX/EXR/TIFF/J2K/PNG/JPEG + legacy hdtv/uhd/4k) with formula-driven frame size computation and `--list-presets`.
- ✅ Optional per-file checksum support (write + verify) with CLI flag and warnings about overhead.
- ✅ Warm-up and duration controls (`--warmup-frames`, `--duration`) to exclude warm-up from stats and cap runs.
- ✅ Configurable latency percentiles (`--percentiles`) and optional histogram output (`--histogram`).

## Near-Term Roadmap
- 🧪 Concurrency visibility: report queue utilization and time spent waiting vs performing I/O to highlight server-side throttling.
- 🧪 Read-after-write path: `--rw` mode to immediately read/verify after each write for end-to-end validation.
- 🧪 Metadata focus: optional cleanup flag and separate counters for create/delete throughput to expose metadata bottlenecks on shared storage.
- 🧪 Time source clarity: log timing source (`performance.now` vs `process.hrtime`) and consider a monotonic clock guard to ensure consistent measurements.
- 🧪 NLE/VFX realism: add containerized payload emulation options to mimic ProRes/DNxHR/etc. I/O (placeholder bytes) and clarify in JSON/header; avoid real codec dependencies.
- 🧪 Preset computation extensions: expose fps-driven data rate projection in headers/JSON and allow user-defined presets via CLI for custom formats.

## Longer-Term
- 📝 Curses/TUI view for live monitoring without external tooling.
- 📝 Export-friendly metrics adapters (Prometheus/Grafana agent mode) using the existing NDJSON as input.
- 📝 Configurable frame payload patterns (random vs zero) for cache-behavior studies.

## Roles / Agents (placeholder)
No separate agents are defined yet. If coordination becomes complex (e.g., TUI, metrics adapters, integrity features in parallel), we can introduce:
- Build agent: implement CLI features with tests.
- Observability agent: design JSON schemas, percentiles/histogram output, and docs.
- QA agent: craft test plans for NFS/SMB scenarios (checksums, metadata stress, queue depth effects).

Until then, a single stream of changes with clear PRD updates and tests should suffice.
