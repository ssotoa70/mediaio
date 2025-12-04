# Operations Runbook

## Typical Runs
```bash
# async write with warmup and duration
npm run cli -- /mnt/share --framesize dpx-4k-10 --frames 1000 \
  --queue-depth 4 --framerate 120 --warmup-frames 50 --duration 60 --json --label nfs-bench

# read/verify with checksum
npm run cli -- --read /mnt/share --framesize dpx-4k-10 --checksum
```

## Interpreting Output
- Text: fps, throughput, latency (min/p50/p90/p99), drops/errors.
- JSON (NDJSON): latency percentiles map, optional histogram, filesystem info, warmup/duration settings.

## Common Issues
- Permission errors: confirm mount write access.
- Low throughput: check queue depth, framerate cap, warm-up duration, and network load.
- Checksum mismatches: re-run without cache (cold), inspect mount health.

## Cleanup
- Remove generated files in test directories.
- If cleanup flag is added in future, prefer that for automation (see roadmap).
