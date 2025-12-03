# Roadmap (Working Copy)

Near-term
- Concurrency visibility: queue utilization and wait vs I/O time.
- Read-after-write (`--rw`) mode for end-to-end validation.
- Metadata focus: create/delete counters and optional cleanup flag.
- Time source clarity: log timing source and consider monotonic guard.
- Containerized payload emulation (ProRes/DNxHR placeholders) with clear labeling.

Future
- Prometheus-friendly metrics adapter.
- TUI for live monitoring.
- User-defined presets via config file.

See `docs/PRD.md` for high-level goals and `docs/CHANGELOG.md` for releases.
