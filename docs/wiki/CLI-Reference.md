# CLI Reference

See `docs/USAGE.md` for full option descriptions and examples.

Common commands:
```bash
npm run cli -- ./out --framesize dpx-4k-10 --frames 100
npm run cli -- --read ./out --framesize dpx-4k-10 --frames 100
npm run cli -- ./out --framerate 60 --queue-depth 4 --json
npm run cli -- --list-presets
```

Key options:
- Mode: `--write` (default) / `--read`
- Size: `--framesize <preset|bytes>`, `--frames-per-file`, `--frames`
- Performance: `--queue-depth`, `--framerate`, `--iosize`
- Metrics: `--json`, `--stats-interval`, `--label`, `--percentiles`, `--histogram`
- Integrity: `--checksum`
- Run control: `--warmup-frames`, `--duration`
