# MediaIO Format Reference (NLE/VFX Focus)

Guidance for cinematic image sequences and video formats relevant to NLE, color, and VFX workflows. Use formulas to derive frame sizes and data rates; avoid hardcoded payload sizes.

## Frame Size & Data Rate Formulas
- Frame bytes (generic): `frame_bytes = width * height * bits_per_pixel / 8`
- YCbCr helpers:
  - 4:4:4 → `bits_per_pixel = 3 * bit_depth`
  - 4:2:2 → `bits_per_pixel = 2 * bit_depth`
  - 4:2:0 → `bits_per_pixel = 1.5 * bit_depth`
- Data rate:
  - `bytes_per_second = frame_bytes * fps`
  - `MB_per_second = bytes_per_second / (1024^2)`
  - `Gb_per_second = bytes_per_second * 8 / 1e9`
- DPX 10-bit shortcut (common VFX/DI plate):
  - Payload only: `frame_bytes = width * height * 4`
  - With header: `total_frame_bytes = (width * height * 4) + 8192`

## Frame-Based / Cinematic Formats (Image Sequences)

Format | Typical Bit-Depth | Primary Use Case
--- | --- | ---
DPX | 10 / 12 / 16 / 32-bit packed | Film scans, DI, VFX plates, mastering
OpenEXR | 16-bit half, 32-bit float | VFX/animation, HDR linear workflows, multi-channel AOVs
TIFF / BigTIFF | 8 / 10 / 12 / 16 / 32-bit | Archival, DI, texture pipelines
ARRIRAW | 12-bit log | Camera original, high-end cinema
REDCODE RAW (R3D) | 12–16-bit | High-end digital cinema, variable compression
Blackmagic RAW (BRAW) | 12-bit | Camera original for BM cameras
Sony RAW / X-OCN | 16-bit linear | Cinema/production capture, FX workflows
JPEG2000 (sequence) | 12 / 16-bit | DCP mastering, archival
PNG | 8 / 16-bit | Graphics, UI, simple frame sequences
JPEG | 8-bit | Non-cinema previews, proxies

Typical resolutions to consider in presets/tests: 2K (2048×1556), 4K (4096×3112), 6K, 8K, and HD/FullHD (1920×1080).

## Video Formats (Editorial, Broadcast, Delivery)

Format | Typical Bit-Depth | Primary Use Case
--- | --- | ---
ProRes 422 family | 10-bit | Editorial, mezzanine, broadcast
ProRes 4444 / XQ | 12-bit + alpha | Mastering, VFX handoff, high-end editorial
DNxHD | 8 / 10-bit | Broadcast HD editorial
DNxHR | 8 / 10-bit | High-res editorial (2K/4K)
H.264 / AVC | 8 / 10-bit | Streaming, proxies, delivery
H.265 / HEVC | 8 / 10 / 12-bit | HDR mastering, streaming
AV1 | 8 / 10 / 12-bit | Next-gen streaming, mezzanine
XAVC / XAVC-I / XAVC-S | 10-bit | ENG, broadcast acquisition
MPEG-2 | 8-bit | Legacy broadcast
DCP (MXF J2K) | 12-bit | Cinema projection (DCI compliant)
IMF (MXF) | 10 / 12-bit | Studio mastering, global distribution

## Notes for MediaIO Benchmarking
- Use formulas above to compute frame sizes for presets (no hardcoded byte counts).
- Provide cinematic presets (2K/4K/6K/8K; 10/12/16-bit; RGB/YCbCr sampling) and let users override fps, bit depth, and sampling.
- For container-based formats (ProRes/DNxHR/etc.), approximate I/O using uncompressed-equivalent frame sizes for storage stress unless codec emulation is added later.
- Checksums: optional per-file checksum exists for integrity validation; expect CPU overhead when enabled.
