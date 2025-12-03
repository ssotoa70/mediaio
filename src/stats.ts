import { formatBytes, formatBytesPerSecond, percentile } from "./utils.js";

type IntervalCounters = {
  frames: number;
  bytes: number;
  errors: number;
  dropped: number;
  latencies: number[];
  startedAt: number;
};

export type IntervalSnapshot = {
  frames: number;
  bytes: number;
  errors: number;
  dropped: number;
  durationSeconds: number;
  fps: number;
  throughputBps: number;
  throughput: string;
  latency: {
    min: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
    p999: number;
  };
};

export type TotalsSnapshot = IntervalSnapshot;

export class StatsCollector {
  private interval: IntervalCounters;
  private totals: IntervalCounters;

  constructor() {
    const now = performance.now();
    this.interval = {
      frames: 0,
      bytes: 0,
      errors: 0,
      dropped: 0,
      latencies: [],
      startedAt: now,
    };
    this.totals = { ...this.interval };
  }

  recordSuccess(frames: number, bytes: number, latencyMs: number) {
    this.interval.frames += frames;
    this.interval.bytes += bytes;
    this.interval.latencies.push(latencyMs);

    this.totals.frames += frames;
    this.totals.bytes += bytes;
    this.totals.latencies.push(latencyMs);
  }

  recordError() {
    this.interval.errors += 1;
    this.totals.errors += 1;
  }

  recordDropped(frames: number) {
    this.interval.dropped += frames;
    this.totals.dropped += frames;
  }

  snapshot(): IntervalSnapshot | undefined {
    const now = performance.now();
    const elapsedMs = now - this.interval.startedAt;
    if (elapsedMs <= 0) {
      return undefined;
    }

    const elapsedSeconds = elapsedMs / 1000;
    const { frames, bytes, errors, dropped } = this.interval;
    const latency = this.computeLatency(this.interval.latencies);
    const throughputBps = bytes / elapsedSeconds;

    const snapshot: IntervalSnapshot = {
      frames,
      bytes,
      errors,
      dropped,
      durationSeconds: elapsedSeconds,
      fps: frames / elapsedSeconds,
      throughputBps,
      throughput: formatBytesPerSecond(bytes, elapsedSeconds),
      latency,
    };

    this.interval.frames = 0;
    this.interval.bytes = 0;
    this.interval.errors = 0;
    this.interval.dropped = 0;
    this.interval.latencies = [];
    this.interval.startedAt = now;

    return snapshot;
  }

  totalsSnapshot(): TotalsSnapshot {
    const elapsedSeconds = (performance.now() - this.totals.startedAt) / 1000;
    const { frames, bytes, errors, dropped } = this.totals;
    const latency = this.computeLatency(this.totals.latencies);

    const throughputBps = elapsedSeconds > 0 ? bytes / elapsedSeconds : 0;

    return {
      frames,
      bytes,
      errors,
      dropped,
      durationSeconds: elapsedSeconds,
      fps: elapsedSeconds > 0 ? frames / elapsedSeconds : 0,
      throughputBps,
      throughput: formatBytesPerSecond(bytes, elapsedSeconds),
      latency,
    };
  }

  private computeLatency(values: number[]) {
    const filtered = values.filter((v) => Number.isFinite(v));
    return {
      min: filtered.length ? Math.min(...filtered) : 0,
      p50: percentile(filtered, 50),
      p75: percentile(filtered, 75),
      p90: percentile(filtered, 90),
      p95: percentile(filtered, 95),
      p99: percentile(filtered, 99),
      p999: percentile(filtered, 99.9),
    };
  }
}

export function formatInterval(label: string, snapshot: IntervalSnapshot) {
  const latency = snapshot.latency;
  return `${label} | ${snapshot.frames} frames | ${snapshot.fps.toFixed(1)} fps | ${snapshot.throughput} | ` +
    `lat(ms) min ${latency.min.toFixed(1)} p50 ${latency.p50.toFixed(1)} p90 ${latency.p90.toFixed(1)} p99 ${latency.p99.toFixed(1)} | ` +
    `dropped ${snapshot.dropped} | errors ${snapshot.errors}`;
}

export function formatTotals(label: string, snapshot: TotalsSnapshot) {
  return `${label} total | ${snapshot.frames} frames | ${formatBytes(snapshot.bytes)} | ${snapshot.fps.toFixed(
    2,
  )} fps | ${snapshot.throughput} | dropped ${snapshot.dropped} | errors ${snapshot.errors}`;
}
