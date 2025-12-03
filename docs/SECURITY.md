# Security

- **Secrets**: No secrets should be committed. Environment variables are not required for the CLI.
- **Dependencies**: Run `npm audit` periodically; prefer non-breaking updates. Document any high-severity issues and remediation plans.
- **Checksums**: Optional per-file checksum (`--checksum`) detects data integrity issues on shared storage; disabled by default for performance.
- **Filesystem safety**: MediaIO reads/writes only under directories you pass. Avoid running with privileged paths.
- **Reporting**: For security issues, open a private report to the maintainer (update CODEOWNERS/contacts as needed).
