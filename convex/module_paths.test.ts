import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const convexRoot = fileURLToPath(new URL("./", import.meta.url));

function moduleFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return moduleFiles(entryPath);
    if (!/\.[cm]?[jt]sx?$/.test(entry.name)) return [];
    if (/\.test\.[cm]?[jt]sx?$/.test(entry.name)) return [];
    return [path.relative(convexRoot, entryPath)];
  });
}

describe("Convex module paths", () => {
  it("uses only deployable path components", () => {
    const invalidPaths = moduleFiles(convexRoot).filter((file) =>
      file.split(path.sep).some((component) => !/^[A-Za-z0-9_.]+$/.test(component)),
    );

    expect(invalidPaths).toEqual([]);
  });
});
