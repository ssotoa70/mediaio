# Design Decisions (ADR Log)

## ADR-0001: Frame-based benchmark, not codec-based
- Context: Need realistic media I/O load without codec dependencies.
- Decision: Use uncompressed frame buffers with cinematic presets; no real codecs.
- Consequences: Simplifies portability; codec emulation remains future work.

## ADR-0002: Optional checksums default off
- Context: Integrity validation vs performance impact.
- Decision: `--checksum` optional, off by default; SHA-256 for portability.
- Consequences: Throughput unaffected by default; validation available when needed.

## ADR-0003: Warm-up frames excluded from stats
- Context: Avoid cold-cache skew.
- Decision: `--warmup-frames` to exclude initial frames from metrics.
- Consequences: More stable steady-state measurements.
