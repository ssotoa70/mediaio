import path from "node:path";
import { mkdir, open, readFile, readdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { StatsCollector, formatInterval, formatTotals, IntervalSnapshot } from "./stats.js";
import { FilesystemInfo, describeFilesystem, detectFilesystem } from "./filesystem.js";
import { safePad, sleep } from "./utils.js";
import { computeChecksum, verifyChecksum } from "./checksum.js";

export type Mode = "write" | "read";

export type RunOptions = {
  mode: Mode;
  dirs: string[];
  frameSize: number;
  frames: number; // 0 means run until interrupted
  framesPerFile: number;
  framerate?: number;
  queueDepth: number;
  ioSize?: number;
  prefix: string;
  statsIntervalMs: number;
  verbose: number;
  json: boolean;
  label?: string;
  presetId?: string;
  checksum: boolean;
};

class Limit {
  private readonly limit: number;
  private active = new Set<Promise<unknown>>();

  constructor(limit: number) {
    this.limit = Math.max(1, limit);
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.active.size >= this.limit) {
      await Promise.race(this.active);
    }

    const promise = fn();
    this.active.add(promise);
    try {
      return await promise;
    } finally {
      this.active.delete(promise);
    }
  }

  async waitForAll() {
    await Promise.allSettled(Array.from(this.active));
  }
}

function createFrameBuffer(frameSize: number, framesInFile: number): Buffer {
  return Buffer.alloc(frameSize * framesInFile);
}

function nextFilePath(dir: string, prefix: string, index: number): string {
  return path.join(dir, `${prefix}_${safePad(index)}.bin`);
}

function checksumPath(filePath: string): string {
  return `${filePath}.sha256`;
}

async function prepareDirs(dirs: string[]) {
  await Promise.all(dirs.map((dir) => mkdir(dir, { recursive: true })));
}

async function listFiles(dir: string, prefix: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries
    .filter((name) => name.startsWith(`${prefix}_`) || name.startsWith(prefix))
    .sort();
}

function computeFrameRateDeadline(
  framerate: number | undefined,
  frames: number,
  deadline: number,
): { nextDeadline: number; delayMs: number; dropped: number } {
  if (!framerate || framerate <= 0) {
    return { nextDeadline: deadline, delayMs: 0, dropped: 0 };
  }

  const intervalMs = 1000 / framerate;
  const now = performance.now();
  if (deadline === 0) {
    return { nextDeadline: now + frames * intervalMs, delayMs: 0, dropped: 0 };
  }

  let dropped = 0;
  if (now > deadline) {
    const behindMs = now - deadline;
    dropped = Math.floor(behindMs / intervalMs);
    return { nextDeadline: now + frames * intervalMs, delayMs: 0, dropped };
  }

  const delayMs = deadline - now;
  return { nextDeadline: deadline + frames * intervalMs, delayMs, dropped };
}

export async function run(options: RunOptions) {
  const fsInfoList = await Promise.all(options.dirs.map((dir) => detectFilesystem(dir)));
  const fsInfo = new Map<string, FilesystemInfo>();
  fsInfoList.forEach((info, idx) => fsInfo.set(options.dirs[idx], info));
  logRunHeader(options, fsInfoList);

  if (options.mode === "write") {
    await produce(options, fsInfo);
  } else {
    await consume(options, fsInfo);
  }
}

async function produce(options: RunOptions, fsInfo: Map<string, FilesystemInfo>) {
  await prepareDirs(options.dirs);
  const totalStats = new StatsCollector();
  const perStreamStats = new Map<string, StatsCollector>();
  options.dirs.forEach((dir) => perStreamStats.set(dir, new StatsCollector()));

  const reporter = startReporter(totalStats, perStreamStats, options, fsInfo);

  const tasks = options.dirs.map((dir) => {
    const streamStats = perStreamStats.get(dir)!;
    return produceDir(dir, options, totalStats, streamStats);
  });
  await Promise.all(tasks);

  clearInterval(reporter);
  reportFinal(totalStats, perStreamStats, "write", options, fsInfo);
}

async function produceDir(
  dir: string,
  options: RunOptions,
  aggregate: StatsCollector,
  streamStats: StatsCollector,
) {
  const limiter = new Limit(options.queueDepth > 0 ? options.queueDepth : 1);
  const useChunkedIO = options.queueDepth === 0 && options.ioSize && options.ioSize > 0;
  if (options.queueDepth > 0 && options.ioSize) {
    console.warn("iosize is ignored in async mode (queue-depth > 0).");
  }
  let produced = 0;
  let fileIndex = 0;
  let deadline = 0;

  while (options.frames === 0 || produced < options.frames) {
    const remaining =
      options.frames === 0 ? options.framesPerFile : Math.min(options.framesPerFile, options.frames - produced);
    const buffer = createFrameBuffer(options.frameSize, remaining);
    const filePath = nextFilePath(dir, options.prefix, fileIndex);

    const timing = computeFrameRateDeadline(options.framerate, remaining, deadline);
    if (timing.dropped > 0) {
      streamStats.recordDropped(timing.dropped);
      aggregate.recordDropped(timing.dropped);
    }
    if (timing.delayMs > 0) {
      await sleep(timing.delayMs);
    }
    deadline = timing.nextDeadline;

    const task = async () => {
      const start = performance.now();
      try {
        if (useChunkedIO && options.ioSize) {
          await writeChunked(filePath, buffer, options.ioSize);
        } else {
          await writeFile(filePath, buffer);
        }
        if (options.checksum) {
          const checksum = computeChecksum(buffer);
          await writeFile(checksumPath(filePath), checksum.hex, "utf8");
        }
        const latency = performance.now() - start;
        streamStats.recordSuccess(remaining, buffer.length, latency);
        aggregate.recordSuccess(remaining, buffer.length, latency);
      } catch (error) {
        console.error(`write failed for ${filePath}:`, error);
        streamStats.recordError();
        aggregate.recordError();
      }
    };

    if (options.queueDepth > 0) {
      await limiter.run(task);
    } else {
      await task();
    }

    produced += remaining;
    fileIndex += 1;
  }

  await limiter.waitForAll();
}

async function consume(options: RunOptions, fsInfo: Map<string, FilesystemInfo>) {
  const totalStats = new StatsCollector();
  const perStreamStats = new Map<string, StatsCollector>();
  options.dirs.forEach((dir) => perStreamStats.set(dir, new StatsCollector()));

  const reporter = startReporter(totalStats, perStreamStats, options, fsInfo);

  const tasks = options.dirs.map((dir) => {
    const streamStats = perStreamStats.get(dir)!;
    return consumeDir(dir, options, totalStats, streamStats);
  });
  await Promise.all(tasks);

  clearInterval(reporter);
  reportFinal(totalStats, perStreamStats, "read", options, fsInfo);
}

async function consumeDir(
  dir: string,
  options: RunOptions,
  aggregate: StatsCollector,
  streamStats: StatsCollector,
) {
  const files = await listFiles(dir, options.prefix);
  if (!files.length) {
    console.warn(`No files found in ${dir} with prefix ${options.prefix}`);
    return;
  }

  const limiter = new Limit(options.queueDepth > 0 ? options.queueDepth : 1);
  const useChunkedIO = options.queueDepth === 0 && options.ioSize && options.ioSize > 0;
  if (options.queueDepth > 0 && options.ioSize) {
    console.warn("iosize is ignored in async mode (queue-depth > 0).");
  }
  let consumed = 0;

  for (const fileName of files) {
    if (options.frames > 0 && consumed >= options.frames) {
      break;
    }

    const filePath = path.join(dir, fileName);
    const jobFrames =
      options.frames === 0
        ? options.framesPerFile
        : Math.min(options.framesPerFile, options.frames - consumed);
    const expectedSize = jobFrames * options.frameSize;

    const task = async () => {
      const start = performance.now();
      try {
        const data = useChunkedIO && options.ioSize ? await readChunked(filePath, options.ioSize) : await readFile(filePath);
        const duration = performance.now() - start;
        const frameCount = Math.floor(data.length / options.frameSize);

        if (options.framesPerFile > 0 && data.length < expectedSize) {
          console.warn(`Size mismatch ${filePath}: expected at least ${expectedSize}, got ${data.length}`);
          streamStats.recordError();
          aggregate.recordError();
        }

        if (data.length % options.frameSize !== 0) {
          console.warn(
            `Partial frame detected in ${filePath}: size ${data.length} not divisible by frame size ${options.frameSize}`,
          );
          streamStats.recordError();
          aggregate.recordError();
        }

        if (options.checksum) {
          const checksumFile = checksumPath(filePath);
          try {
            const expected = await readFile(checksumFile, "utf8");
            const result = verifyChecksum(data, expected.trim());
            if (!result.ok) {
              console.warn(`Checksum mismatch for ${filePath}: expected ${expected.trim()} got ${result.hex}`);
              streamStats.recordError();
              aggregate.recordError();
            }
          } catch (err) {
            console.warn(`Checksum missing or unreadable for ${filePath}:`, err);
            streamStats.recordError();
            aggregate.recordError();
          }
        }

        streamStats.recordSuccess(frameCount, data.length, duration);
        aggregate.recordSuccess(frameCount, data.length, duration);
      } catch (error) {
        console.error(`read failed for ${filePath}:`, error);
        streamStats.recordError();
        aggregate.recordError();
      }
    };

    if (options.queueDepth > 0) {
      await limiter.run(task);
    } else {
      await task();
    }

    consumed += jobFrames;
  }

  await limiter.waitForAll();
}

function startReporter(
  total: StatsCollector,
  perStream: Map<string, StatsCollector>,
  options: RunOptions,
  fsInfo: Map<string, FilesystemInfo>,
): NodeJS.Timeout {
  return setInterval(() => {
    const totalSnapshot = total.snapshot();
    if (totalSnapshot) {
      printSnapshot("aggregate", undefined, totalSnapshot, options, fsInfo);
    }

    for (const [dir, stats] of perStream.entries()) {
      const snapshot = stats.snapshot();
      if (snapshot) {
        printSnapshot("stream", dir, snapshot, options, fsInfo);
      }
    }
  }, options.statsIntervalMs);
}

function reportFinal(
  total: StatsCollector,
  perStream: Map<string, StatsCollector>,
  label: string,
  options: RunOptions,
  fsInfo: Map<string, FilesystemInfo>,
) {
  printTotals("aggregate", undefined, total.totalsSnapshot(), options, fsInfo, label);
  for (const [dir, stats] of perStream.entries()) {
    printTotals("stream", dir, stats.totalsSnapshot(), options, fsInfo, label);
  }
}

type Scope = "aggregate" | "stream";

function printSnapshot(
  scope: Scope,
  dir: string | undefined,
  snapshot: IntervalSnapshot,
  options: RunOptions,
  fsInfo: Map<string, FilesystemInfo>,
) {
  if (options.json) {
    console.log(JSON.stringify(toJson(scope, dir, snapshot, options, fsInfo, "interval")));
    return;
  }

  const label = scope === "aggregate" ? `${options.mode} agg` : `${options.mode} ${dir}`;
  console.log(formatInterval(label, snapshot));
}

function printTotals(
  scope: Scope,
  dir: string | undefined,
  snapshot: IntervalSnapshot,
  options: RunOptions,
  fsInfo: Map<string, FilesystemInfo>,
  label: string,
) {
  if (options.json) {
    console.log(JSON.stringify(toJson(scope, dir, snapshot, options, fsInfo, "total")));
    return;
  }
  const textLabel = scope === "aggregate" ? `${label}` : `${label} ${dir}`;
  console.log(formatTotals(textLabel, snapshot));
}

type Phase = "interval" | "total";

function toJson(
  scope: Scope,
  dir: string | undefined,
  snapshot: IntervalSnapshot,
  options: RunOptions,
  fsInfo: Map<string, FilesystemInfo>,
  phase: Phase,
) {
  const fs = dir ? fsInfo.get(dir) : undefined;

  return {
    timestamp: new Date().toISOString(),
    phase,
    scope,
    mode: options.mode,
    dir,
    label: options.label,
    frameSize: options.frameSize,
    framesPerFile: options.framesPerFile,
    framerate: options.framerate ?? null,
    queueDepth: options.queueDepth,
    stats: {
      intervalSeconds: snapshot.durationSeconds,
      frames: snapshot.frames,
      bytes: snapshot.bytes,
      fps: snapshot.fps,
      throughputBps: snapshot.throughputBps,
      throughput: snapshot.throughput,
      latencyMs: snapshot.latency,
      errors: snapshot.errors,
      dropped: snapshot.dropped,
    },
    filesystem: fs
      ? {
          type: fs.type,
          location: fs.location,
          source: fs.source,
        }
      : undefined,
  };
}

async function writeChunked(filePath: string, buffer: Buffer, chunkSize: number) {
  const handle = await open(filePath, "w");
  try {
    let offset = 0;
    while (offset < buffer.length) {
      const end = Math.min(buffer.length, offset + chunkSize);
      const chunk = buffer.subarray(offset, end);
      await handle.write(chunk, 0, chunk.length, offset);
      offset = end;
    }
  } finally {
    await handle.close();
  }
}

async function readChunked(filePath: string, chunkSize: number): Promise<Buffer> {
  const handle = await open(filePath, "r");
  const chunks: Buffer[] = [];
  let total = 0;
  const temp = Buffer.alloc(chunkSize);

  try {
    while (true) {
      const { bytesRead } = await handle.read(temp, 0, chunkSize, null);
      if (bytesRead <= 0) {
        break;
      }
      chunks.push(Buffer.from(temp.subarray(0, bytesRead)));
      total += bytesRead;
    }
  } finally {
    await handle.close();
  }

  return Buffer.concat(chunks, total);
}

function logRunHeader(options: RunOptions, fsInfo: FilesystemInfo[]) {
  const parts = [
    `mediaIO ${options.mode}`,
    `frameSize=${options.frameSize}${options.presetId ? ` (${options.presetId})` : ""}`,
    `frames=${options.frames === 0 ? "until-stop" : options.frames}`,
    `framesPerFile=${options.framesPerFile}`,
    `framerate=${options.framerate ?? "unlimited"}`,
    `queueDepth=${options.queueDepth}`,
    `dirs=${options.dirs.join(",")}`,
    `fs=${fsInfo.map(describeFilesystem).join("; ")}`,
    options.label ? `label=${options.label}` : undefined,
  ];

  console.log(parts.filter(Boolean).join(" | "));
}
