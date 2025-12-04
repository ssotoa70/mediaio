# Installation & Deployment

## Requirements
- Node.js 18+
- npm

## Install
```bash
npm install
npm run build
```

## Verify
```bash
npm test
npm run cli -- ./out --frames 3 --framesize dpx-4k-10
```

## Notes
- No global install needed; runs via `npm run cli --`.
- Checksums (`--checksum`) add CPU overhead; keep off for peak throughput.
- For NFS/SMB, ensure read/write permissions to the target mount.
