# FAQ

**Does MediaIO modify system files?**  
No. It only reads/writes under the directories you specify.

**Why is throughput lower with `--checksum`?**  
Checksums add CPU work. Use only when validating integrity; keep off for peak throughput.

**How do I benchmark NFS/SMB reliably?**  
Use warm-up frames, duration caps, async queue depth, and JSON output. Pin to a dedicated mount and avoid other workloads.

**Can I add my own presets?**  
Currently via byte sizes; future enhancement will allow custom preset definitions. See `docs/FORMATS.md` for formulas.

**How do I get machine-readable metrics?**  
Use `--json` for NDJSON output; feed into dashboards.

**What about containers/codecs (ProRes/DNxHR)?**  
Not simulated yet. Roadmap includes placeholder payload modes for container I/O without real codecs.
