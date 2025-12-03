# MediaIO

MediaIO is a CLI benchmark for media-style I/O (frame-based write/read) with cinematic presets, per-stream and aggregate stats, integrity checks, and JSON outputs tailored for shared storage (NFS/SMB) and local filesystems.

## Quick Start
```bash
npm install
npm run build
npm run cli -- ./out --framesize dpx-4k-10 --frames 100 --queue-depth 4 --json
```

## Key Features
- Frame-based producer/consumer with per-stream + aggregate metrics (fps, throughput, latency percentiles, drops/errors).
- Cinematic presets (DPX/EXR/TIFF/J2K/PNG/JPEG + legacy) using formula-driven frame sizing; checksum option.
- Warm-up and duration controls; configurable latency percentiles and optional histogram.
- Filesystem detection (local vs network), NDJSON output for dashboards.

## Documentation
- Architecture: `docs/ARCHITECTURE.md`
- Installation: `docs/INSTALLATION.md`
- Usage & CLI options: `docs/USAGE.md`
- Roadmap: `docs/ROADMAP.md`
- Security: `docs/SECURITY.md`
- Changelog: `docs/CHANGELOG.md`
- Contributing: `docs/CONTRIBUTING.md`
- FAQ: `docs/FAQ.md`
- PRD & cinematic formats: `docs/PRD.md`, `docs/FORMATS.md`

## Wiki & Project Board
- Wiki (overview, ops, troubleshooting, ADRs) — create in GitHub Wiki; link it here once enabled.
- Project board (GitHub Projects v2) — statuses: Backlog/Planning/In Progress/Review/Testing/Blocked/Done; tags: documentation/refactor/automation/performance/security/cleanup/future/nice-to-have/breaking-change. Populate with structure, docs, future roadmap, and technical enhancements.

## Status
- Current version: `0.3.0`
- Code: `src/`
- Tests: `tests/`
- Assets/diagrams: `assets/`
- Automation/templates: `.github/`

## License
MIT (default). Update `LICENSE` if different is required.
