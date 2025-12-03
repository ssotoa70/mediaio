import { describe, expect, it } from "vitest";
import { __internal } from "../src/filesystem.js";

describe("filesystem helpers", () => {
  it("parses /proc/mounts style lines", () => {
    const mounts = __internal.parseProcMounts("devtmpfs /dev devtmpfs rw,relatime 0 0\n/dev/sda1 / ext4 rw 0 0\n");
    expect(mounts).toEqual([
      { mountPoint: "/dev", type: "devtmpfs" },
      { mountPoint: "/", type: "ext4" },
    ]);
  });

  it("selects the deepest mount for a path", () => {
    const mounts = [
      { mountPoint: "/", type: "ext4" },
      { mountPoint: "/mnt/share", type: "nfs" },
      { mountPoint: "/mnt/share/team", type: "nfs" },
    ];

    const match = __internal.findMountForPath("/mnt/share/team/subdir/file", mounts);
    expect(match?.mountPoint).toBe("/mnt/share/team");
  });
});
