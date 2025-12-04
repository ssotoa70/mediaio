# Security & Compliance

- No secrets required; do not commit credentials.
- Checksums (`--checksum`) detect data integrity issues; off by default for performance.
- Scope writes to intended directories/mounts; avoid privileged paths.
- Run `npm audit` periodically; document remediation for critical/high issues.
- Follow CODEOWNERS for reviews; use security disclosure channels (see `.github/SECURITY.md`).
