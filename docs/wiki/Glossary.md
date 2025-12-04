# Glossary

- **Frame preset**: Named resolution/bit-depth combo (e.g., `dpx-4k-10`) used to size buffers.
- **Warm-up frames**: Frames excluded from stats to avoid cold-cache skew.
- **Duration cap**: Max runtime after which loops stop even if frames remain.
- **Queue depth**: Async concurrency level for I/O operations.
- **Checksum**: Optional SHA-256 per file to detect corruption/truncation.
- **NDJSON**: Newline-delimited JSON output for machine ingestion.
- **Filesystem detection**: Best-effort local vs network (NFS/SMB) identification.
