# Troubleshooting

- **Permission errors**: ensure write access to target directory/mount.
- **Low throughput**: increase queue depth, adjust framerate cap, extend warm-up, reduce checksum usage.
- **Checksum mismatches**: rerun with checksum, verify mount health, avoid concurrent deletes.
- **Partial frames**: check `frames-per-file` and frame size alignment; warn on size mismatch.
- **Mount type unknown**: filesystem detection is best-effort; proceed with manual labeling.

See `docs/FAQ.md` for more Q&A.
