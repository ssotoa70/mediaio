import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

type MountInfo = {
  mountPoint: string;
  type: string;
};

export type FilesystemInfo = {
  path: string;
  type: string;
  location: "local" | "network" | "unknown";
  source: "proc" | "mount" | "statfs" | "guess";
};

const NETWORK_TYPES = new Set(["nfs", "nfs4", "cifs", "smb", "smbfs", "smb3", "afpfs", "sshfs", "fuse.sshfs"]);

const STATFS_TYPES = new Map<number, string>([
  [0xef53, "ext"], // ext2/3/4
  [0x6969, "nfs"], // NFS
  [0xfe534d42, "smb"], // SMB
  [0x5346544e, "ntfs"], // NTFS
  [0x01021994, "tmpfs"],
  [0x9123683e, "btrfs"],
  [0x858458f6, "ramfs"],
  [0x42494e4d, "nilfs"],
  [0x4d44, "msdos"],
]);

function classify(type: string): FilesystemInfo["location"] {
  if (!type) {
    return "unknown";
  }

  if (NETWORK_TYPES.has(type.toLowerCase())) {
    return "network";
  }

  return "local";
}

function parseProcMounts(content: string): MountInfo[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(" ");
      return { mountPoint: parts[1], type: parts[2] } satisfies MountInfo;
    });
}

function parseMountOutput(content: string): MountInfo[] {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const results: MountInfo[] = [];

  for (const line of lines) {
    // Example (macOS): /dev/disk3s5s1 on / (apfs, local, read-only, journaled)
    // Example (BSD-ish): tank/foo on /foo (zfs, local)
    const match = /^(.+?) on (.+?) \(([^,]+),/.exec(line);
    if (match) {
      results.push({ mountPoint: match[2], type: match[3] });
    }
  }

  return results;
}

function findMountForPath(targetPath: string, mounts: MountInfo[]): MountInfo | undefined {
  const normalized = path.resolve(targetPath);
  let best: MountInfo | undefined;

  for (const mount of mounts) {
    const mountPath = path.resolve(mount.mountPoint);
    if (normalized === mountPath || normalized.startsWith(`${mountPath}${path.sep}`)) {
      if (!best || mountPath.length > path.resolve(best.mountPoint).length) {
        best = mount;
      }
    }
  }

  return best;
}

async function detectViaProc(targetPath: string): Promise<FilesystemInfo | undefined> {
  try {
    const data = await readFile("/proc/mounts", "utf8");
    const mounts = parseProcMounts(data);
    const match = findMountForPath(targetPath, mounts);
    if (!match) return undefined;

    return {
      path: targetPath,
      type: match.type,
      location: classify(match.type),
      source: "proc",
    };
  } catch {
    return undefined;
  }
}

async function detectViaMountCommand(targetPath: string): Promise<FilesystemInfo | undefined> {
  const commands: Array<[string, string[]]> = [
    ["mount", ["-p"]], // macOS supports -p for parseable output
    ["mount", []],
  ];

  for (const [cmd, args] of commands) {
    try {
      const { stdout } = await execFileAsync(cmd, args);
      const mounts = parseMountOutput(stdout.toString());
      const match = findMountForPath(targetPath, mounts);
      if (!match) continue;

      return {
        path: targetPath,
        type: match.type,
        location: classify(match.type),
        source: "mount",
      };
    } catch {
      // try next
    }
  }

  return undefined;
}

async function detectViaStatfs(targetPath: string): Promise<FilesystemInfo | undefined> {
  const fs = await import("node:fs/promises");
  if (!("statfs" in fs)) {
    return undefined;
  }

  try {
    const stat = await (fs as typeof import("node:fs/promises")).statfs(targetPath);
    const mapped = STATFS_TYPES.get(stat.type);
    const type = mapped ?? `0x${stat.type.toString(16)}`;
    return {
      path: targetPath,
      type,
      location: classify(mapped ?? ""),
      source: "statfs",
    };
  } catch {
    return undefined;
  }
}

function detectWin(targetPath: string): FilesystemInfo {
  if (targetPath.startsWith("\\\\")) {
    return {
      path: targetPath,
      type: "smb",
      location: "network",
      source: "guess",
    };
  }

  // Best-effort guess; detailed detection is platform-specific and costly for MVP.
  return {
    path: targetPath,
    type: "ntfs",
    location: "local",
    source: "guess",
  };
}

export async function detectFilesystem(targetPath: string): Promise<FilesystemInfo> {
  if (process.platform === "win32") {
    return detectWin(targetPath);
  }

  const detectors = [detectViaProc, detectViaMountCommand, detectViaStatfs];

  for (const detector of detectors) {
    const result = await detector(targetPath);
    if (result) {
      return result;
    }
  }

  return {
    path: targetPath,
    type: "unknown",
    location: "unknown",
    source: "guess",
  };
}

export function describeFilesystem(info: FilesystemInfo): string {
  return `${info.type} (${info.location}, ${info.source})`;
}

// Exporting helpers for tests.
export const __internal = { parseProcMounts, parseMountOutput, findMountForPath };
