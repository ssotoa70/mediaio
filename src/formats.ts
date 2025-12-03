export type Chroma = "444" | "422" | "420" | "mono";

export type FramePreset = {
  id: string;
  format: string;
  width: number;
  height: number;
  bitDepth: number;
  channels: number;
  chroma?: Chroma;
  headerBytes?: number;
  packing?: "dpx10";
  note?: string;
};

export const FRAME_PRESETS: FramePreset[] = [
  // DPX (RGB log/linear, assume 3 channels)
  { id: "dpx-2k-10", format: "DPX", width: 2048, height: 1556, bitDepth: 10, channels: 3, headerBytes: 8192, packing: "dpx10" },
  { id: "dpx-4k-10", format: "DPX", width: 4096, height: 3112, bitDepth: 10, channels: 3, headerBytes: 8192, packing: "dpx10" },
  { id: "dpx-4k-12", format: "DPX", width: 4096, height: 3112, bitDepth: 12, channels: 3, headerBytes: 8192 },
  { id: "dpx-4k-16", format: "DPX", width: 4096, height: 3112, bitDepth: 16, channels: 3, headerBytes: 8192 },
  { id: "dpx-8k-16", format: "DPX", width: 8192, height: 6224, bitDepth: 16, channels: 3, headerBytes: 8192 },

  // OpenEXR (assume RGBA channels)
  { id: "exr-2k-16f", format: "OpenEXR", width: 2048, height: 1556, bitDepth: 16, channels: 4, note: "Half float" },
  { id: "exr-4k-16f", format: "OpenEXR", width: 4096, height: 3112, bitDepth: 16, channels: 4, note: "Half float" },
  { id: "exr-4k-32f", format: "OpenEXR", width: 4096, height: 3112, bitDepth: 32, channels: 4, note: "Float" },
  { id: "exr-8k-16f", format: "OpenEXR", width: 8192, height: 6224, bitDepth: 16, channels: 4, note: "Half float" },

  // TIFF / BigTIFF (RGB)
  { id: "tiff-4k-16", format: "TIFF", width: 4096, height: 3112, bitDepth: 16, channels: 3 },
  { id: "tiff-4k-32f", format: "TIFF", width: 4096, height: 3112, bitDepth: 32, channels: 3, note: "Float" },

  // JPEG2000 sequence (DCI-like, 4:4:4)
  { id: "j2k-4k-12", format: "JPEG2000", width: 4096, height: 2160, bitDepth: 12, channels: 3, chroma: "444" },
  { id: "j2k-4k-16", format: "JPEG2000", width: 4096, height: 2160, bitDepth: 16, channels: 3, chroma: "444" },

  // PNG / JPEG (RGB)
  { id: "png-4k-16", format: "PNG", width: 4096, height: 2160, bitDepth: 16, channels: 3 },
  { id: "jpeg-4k-8", format: "JPEG", width: 4096, height: 2160, bitDepth: 8, channels: 3 },

  // Legacy simple presets (aliases)
  { id: "hdtv", format: "RGB", width: 1920, height: 1080, bitDepth: 8, channels: 4, note: "Alias for legacy 1080p RGBA" },
  { id: "uhd", format: "RGB", width: 3840, height: 2160, bitDepth: 8, channels: 3, note: "Alias for legacy UHD RGB" },
  { id: "4k", format: "RGB", width: 4096, height: 2160, bitDepth: 8, channels: 3, note: "Alias for legacy 4K RGB" },
];

export function frameSizeFromPreset(preset: FramePreset): number {
  if (preset.packing === "dpx10") {
    return preset.width * preset.height * 4 + (preset.headerBytes ?? 0);
  }

  const bitsPerPixel = computeBitsPerPixel(preset);
  const base = (preset.width * preset.height * bitsPerPixel) / 8;
  return Math.round(base + (preset.headerBytes ?? 0));
}

function computeBitsPerPixel(preset: FramePreset): number {
  if (preset.chroma === "422") {
    return 2 * preset.bitDepth;
  }
  if (preset.chroma === "420") {
    return 1.5 * preset.bitDepth;
  }
  // Default RGB/mono
  const channels = preset.channels || 3;
  return channels * preset.bitDepth;
}

export function listPresetSummaries() {
  return FRAME_PRESETS.map((p) => ({
    id: p.id,
    format: p.format,
    width: p.width,
    height: p.height,
    bitDepth: p.bitDepth,
    channels: p.channels,
    chroma: p.chroma ?? "n/a",
    headerBytes: p.headerBytes ?? 0,
    bytes: frameSizeFromPreset(p),
    note: p.note,
  }));
}
