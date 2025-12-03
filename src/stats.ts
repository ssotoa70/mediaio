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
    percentiles: Record<string, number>;
    histogram?: {
      edges: number[];
      counts: number[];
    };
  };
};

export type TotalsSnapshot = IntervalSnapshot;

export class StatsCollector {
  private interval: IntervalCounters;
  private totals: IntervalCounters;
  private readonly percentiles: number[];
  private readonly histogramEdges?: number[];

  constructor(percentiles: number[], histogramEdges?: number[]) {
    this.percentiles = percentiles;
    this.histogramEdges = histogramEdges;
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
    const min = filtered.length ? Math.min(...filtered) : 0;
    const percentiles: Record<string, number> = {};
    for (const p of this.percentiles) {
      percentiles[p.toString()] = percentile(filtered, p);
    }

    const histogram = this.histogramEdges ? buildHistogram(filtered, this.histogramEdges) : undefined;

    return { min, percentiles, histogram };
  }
}

export function formatInterval(label: string, snapshot: IntervalSnapshot) {
  const latency = snapshot.latency;
  const p50 = latency.percentiles["50"] ?? latency.percentiles["50.0"];
  const p90 = latency.percentiles["90"] ?? latency.percentiles["90.0"] ?? latency.percentiles["95"];
  const p99 = latency.percentiles["99"] ?? latency.percentiles["99.0"] ?? latency.percentiles["99.9"];
  return `${label} | ${snapshot.frames} frames | ${snapshot.fps.toFixed(1)} fps | ${snapshot.throughput} | ` +
    `lat(ms) min ${latency.min.toFixed(1)} p50 ${fmt(p50)} p90 ${fmt(p90)} p99 ${fmt(p99)} | ` +
    `dropped ${snapshot.dropped} | errors ${snapshot.errors}`;
}

export function formatTotals(label: string, snapshot: TotalsSnapshot) {
  return `${label} total | ${snapshot.frames} frames | ${formatBytes(snapshot.bytes)} | ${snapshot.fps.toFixed(
    2,
  )} fps | ${snapshot.throughput} | dropped ${snapshot.dropped} | errors ${snapshot.errors}`;
}

function fmt(value: number | undefined) {
  return value !== undefined ? value.toFixed(1) : "n/a";
}

function buildHistogram(values: number[], edges: number[]) {
  const counts = new Array(edges.length + 1).fill(0);
  for (const v of values) {
    let placed = false;
    for (let i = 0; i < edges.length; i += 1) {
      if (v <= edges[i]) {
        counts[i] += 1;
        placed = true;
        break;
      }
    }
    if (!placed) {
      counts[counts.length - 1] += 1;
    }
  }
  return { edges, counts };
}
