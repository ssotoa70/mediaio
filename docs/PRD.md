# Product Requirements (MediaIO)

## Purpose
Benchmark video-frame style I/O (producer/consumer) with realistic media presets to measure throughput, latency, and integrity on local and shared storage.

## Users
- Storage/infra engineers validating mounts (NFS/SMB/local).
- Media pipeline developers testing NLE/VFX workflows.

## MVP (delivered)
- Producer/consumer CLI, per-stream + aggregate stats, cinematic presets, NDJSON output.
- Optional checksums; warm-up/duration controls; configurable percentiles/histogram.

## Out of Scope (now)
- Real codecs/transcoding; network copies.

## Success
- Repeatable runs with clear metrics (fps, MB/s, latency, drops/errors).
- Integrity validation via checksum when enabled.
