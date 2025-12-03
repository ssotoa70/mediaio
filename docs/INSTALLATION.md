# Installation

## Prerequisites
- Node.js 18+ (uses ES modules).
- npm (bundled with Node).

## Install
```bash
npm install
npm run build
```

## Local Verification
```bash
npm test
npm run cli -- ./out --frames 3 --framesize dpx-4k-10
```

## Notes
- No global install required; runs via `npm run cli -- ...`.
- Checksums are optional and add CPU overhead.
- For shared storage tests, ensure you have read/write permissions to the target mount.
