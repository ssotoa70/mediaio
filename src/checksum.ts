import { createHash } from "node:crypto";

export type ChecksumResult = {
  hex: string;
  durationMs: number;
};

export function computeChecksum(buffer: Buffer, algorithm: "xxhash64" | "sha256" = "sha256"): ChecksumResult {
  const start = performance.now();
  const hash = createHash(algorithm === "xxhash64" ? "sha256" : "sha256"); // placeholder: use sha256 until xxhash available
  hash.update(buffer);
  const hex = hash.digest("hex");
  return { hex, durationMs: performance.now() - start };
}

export function verifyChecksum(buffer: Buffer, expectedHex: string): ChecksumResult & { ok: boolean } {
  const result = computeChecksum(buffer);
  return { ...result, ok: result.hex === expectedHex };
}
