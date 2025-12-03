import { frameSizeFromPreset, FRAME_PRESETS, FramePreset } from "./formats.js";
import { setTimeout as delay } from "node:timers/promises";

export type SizeParseResult = { value: number; preset?: FramePreset["id"] };

const DECIMAL_MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  m: 1_000_000,
  g: 1_000_000_000,
};

const BINARY_MULTIPLIERS: Record<string, number> = {
  K: 1_024,
  M: 1_024 ** 2,
  G: 1_024 ** 3,
};

export function parseSize(input: string): SizeParseResult {
  const preset = FRAME_PRESETS.find((p) => p.id.toLowerCase() === input.toLowerCase());
  if (preset) {
    return { value: frameSizeFromPreset(preset), preset: preset.id };
  }

  const match = /^(\d+)([kKmMgG]?)$/.exec(input);
  if (!match) {
    throw new Error(
      `Invalid size value "${input}". Use presets (${FRAME_PRESETS.map((p) => p.id).join(
        ", ",
      )}) or number with k/m/g suffix.`,
    );
  }

  const [, raw, suffix] = match;
  const base = Number.parseInt(raw, 10);
  if (!suffix) {
    return { value: base };
  }

  if (suffix in DECIMAL_MULTIPLIERS) {
    return { value: base * DECIMAL_MULTIPLIERS[suffix] };
  }

  if (suffix in BINARY_MULTIPLIERS) {
    return { value: base * BINARY_MULTIPLIERS[suffix] };
  }

  throw new Error(`Unknown size suffix "${suffix}" in "${input}".`);
}

export function formatBytesPerSecond(bytes: number, seconds: number): string {
  if (seconds <= 0) {
    return "0 B/s";
  }

  const rate = bytes / seconds;
  return `${formatBytes(rate)}/s`;
}

export function formatBytes(value: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let num = value;
  let unitIndex = 0;

  while (num >= 1024 && unitIndex < units.length - 1) {
    num /= 1024;
    unitIndex += 1;
  }

  return `${num.toFixed(num >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function percentile(values: number[], percentileValue: number): number {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[index];
}

export function safePad(num: number, digits = 7): string {
  return num.toString().padStart(digits, "0");
}

export const sleep = delay;
