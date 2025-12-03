import { describe, expect, it } from "vitest";
import { parseSize } from "../src/utils.js";
import { frameSizeFromPreset, FRAME_PRESETS } from "../src/formats.js";

describe("parseSize", () => {
  it("parses presets", () => {
    expect(parseSize("hdtv").value).toBe(8294400);
    expect(parseSize("UHD").value).toBe(24883200);
  });

  it("computes cinematic presets via formulas", () => {
    const dpx4k10 = parseSize("dpx-4k-10");
    const preset = FRAME_PRESETS.find((p) => p.id === "dpx-4k-10");
    expect(preset).toBeTruthy();
    expect(dpx4k10.value).toBe(frameSizeFromPreset(preset!));
    // DPX 4K 10-bit: width*height*4 + header(8192)
    expect(dpx4k10.value).toBe(4096 * 3112 * 4 + 8192);
  });

  it("parses decimal and binary suffixes", () => {
    expect(parseSize("1k").value).toBe(1000);
    expect(parseSize("1K").value).toBe(1024);
    expect(parseSize("2m").value).toBe(2_000_000);
    expect(parseSize("2M").value).toBe(2_097_152);
  });

  it("throws on invalid values", () => {
    expect(() => parseSize("bad")).toThrow();
    expect(() => parseSize("12x")).toThrow();
  });
});
