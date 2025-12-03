#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import { run, RunOptions } from "./runner.js";
import { parsePercentiles, parseSize } from "./utils.js";
import { listPresetSummaries } from "./formats.js";

const program = new Command();

program
  .name("mediaIO")
  .description("Media-style I/O benchmark (producer/consumer), inspired by vidio.")
  .argument("<dirs...>", "one or more directories to use for I/O streams")
  .option("-r, --read", "consumer mode (default is write)", false)
  .option("-w, --write", "producer mode (default)", false)
  .option(
    "-f, --framesize <size>",
    "frame size (frame preset like dpx-4k-10/exr-4k-16f/hdtv or bytes with k/m/g suffix)",
    "hdtv",
  )
  .option("-n, --frames <number>", "number of frames (0 = run until interrupted)", "60")
  .option("-N, --frames-per-file <number>", "frames per file", "1")
  .option("-F, --framerate <fps>", "target frames per second (async only)", undefined)
  .option("-q, --queue-depth <number>", "async queue depth (0 = synchronous)", "0")
  .option("-i, --iosize <size>", "sync I/O size override (defaults to framesize)", undefined)
  .option("-p, --prefix <prefix>", "file name prefix", "mediaio")
  .option("-s, --stats-interval <ms>", "stats print interval (ms)", "1000")
  .option("-v, --verbose", "increase verbosity", (_, prev: number) => prev + 1, 0)
  .option("--json", "emit stats as NDJSON instead of text", false)
  .option("-l, --label <label>", "tag to include in outputs", undefined)
  .option("--checksum", "compute and verify per-file checksums (adds CPU overhead)", false)
  .option("--warmup-frames <number>", "frames to warm up (excluded from stats)", "0")
  .option("--duration <seconds>", "max duration to run (seconds)", undefined)
  .option(
    "--percentiles <list>",
    "comma-separated latency percentiles (default 50,75,90,95,99,99.9)",
    "50,75,90,95,99,99.9",
  )
  .option("--histogram", "include latency histogram in JSON output", false)
  .option("--list-presets", "list available frame presets and exit", false);

program.parse();
const args = program.args as string[];
const opts = program.opts<{
  read: boolean;
  write: boolean;
  framesize: string;
  frames: string;
  framesPerFile: string;
  framerate?: string;
  queueDepth: string;
  iosize?: string;
  prefix: string;
  statsInterval: string;
  verbose: number;
  json: boolean;
  label?: string;
  checksum: boolean;
  warmupFrames: string;
  duration?: string;
  percentiles: string;
  histogram: boolean;
  listPresets: boolean;
}>();

const mode = opts.read ? "read" : "write";
if (opts.read && opts.write) {
  console.error("Choose either --read or --write, not both.");
  process.exit(1);
}

if (opts.listPresets) {
  const list = listPresetSummaries();
  for (const preset of list) {
    const base = `${preset.id.padEnd(12)} | ${preset.format.padEnd(8)} | ${preset.width}x${preset.height} | ${preset.bitDepth}-bit`;
    const details = `ch ${preset.channels} chroma ${preset.chroma} header ${preset.headerBytes}B size ${preset.bytes}B`;
    const note = preset.note ? ` | ${preset.note}` : "";
    console.log(`${base} | ${details}${note}`);
  }
  process.exit(0);
}

if (!args.length) {
  console.error("At least one directory must be provided.");
  process.exit(1);
}

try {
  const sizeResult = parseSize(opts.framesize);
  const frameSize = sizeResult.value;
  const ioSize = opts.iosize ? parseSize(opts.iosize).value : undefined;
  const percentiles = parsePercentiles(opts.percentiles);

  const options: RunOptions = {
    mode,
    dirs: args.map((dir) => path.resolve(dir)),
    frameSize,
    frames: Number.parseInt(opts.frames, 10),
    framesPerFile: Number.parseInt(opts.framesPerFile, 10),
    framerate: opts.framerate ? Number.parseFloat(opts.framerate) : undefined,
    queueDepth: Number.parseInt(opts.queueDepth, 10),
    ioSize,
    prefix: opts.prefix,
    statsIntervalMs: Number.parseInt(opts.statsInterval, 10),
    verbose: opts.verbose,
    json: Boolean(opts.json),
    label: opts.label,
    presetId: sizeResult.preset,
    checksum: Boolean(opts.checksum),
    warmupFrames: Number.parseInt(opts.warmupFrames, 10),
    durationSeconds: opts.duration ? Number.parseFloat(opts.duration) : undefined,
    percentiles,
    histogramEdges: opts.histogram ? [0.25, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500] : undefined,
  };

  validateOptions(options);
  await run(options);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

function validateOptions(options: RunOptions) {
  if (options.frameSize <= 0) throw new Error("framesize must be positive.");
  if (options.frames < 0) throw new Error("frames must be >= 0.");
  if (options.framesPerFile <= 0) throw new Error("frames-per-file must be >= 1.");
  if (options.queueDepth < 0) throw new Error("queue-depth must be >= 0.");
  if (options.framerate !== undefined && options.framerate <= 0) throw new Error("framerate must be > 0.");
  if (options.statsIntervalMs < 100) throw new Error("stats interval too small (min 100ms).");
  if (options.warmupFrames < 0) throw new Error("warmup-frames must be >= 0.");
  if (options.durationSeconds !== undefined && options.durationSeconds <= 0) {
    throw new Error("duration must be > 0 seconds.");
  }
}
